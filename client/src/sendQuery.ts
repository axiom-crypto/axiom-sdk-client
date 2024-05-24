import {
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  DataSubquery,
} from "@axiom-crypto/circuit";
import { createPublicClient, encodeFunctionData, http } from "viem";
import { getMaxFeePerGas } from "./axiom/utils";
import { AbiType, AxiomV2QueryOptions, AxiomV2SendQueryArgs, BridgeType, ChainConfig } from "./types";
import { encodeFullQueryV2 } from "@axiom-crypto/circuit/pkg/tools";
import { calculateFeeDataExtended, calculatePayment } from "./lib/paymentCalc";
import { viemChain } from "./lib/viem";
import { getAxiomV2Abi } from "./lib";
import { QueryBuilderClient, QueryBuilderClientConfig } from "./queryBuilderClient";

export const buildSendQuery = async (input: {
  chainId: string;
  rpcUrl: string;
  axiomV2QueryAddress: string;
  dataQuery: DataSubquery[];
  computeQuery: AxiomV2ComputeQuery;
  callback: AxiomV2Callback;
  caller: string;
  mock: boolean;
  options: AxiomV2QueryOptions;
  target?: ChainConfig;
}): Promise<AxiomV2SendQueryArgs> => {
  const validate = input.options?.overrides?.validateBuild ?? true;
  if (input.caller === "") {
    throw new Error("`caller` is required");
  }
  const sourceChainId = input.chainId;
  const sourceRpcUrl = input.rpcUrl;
  const targetChainId = input.target?.chainId ?? input.chainId;
  const targetRpcUrl = input.target?.rpcUrl ?? input.rpcUrl;
  const abi = getAxiomV2Abi(AbiType.Query);

  let options = { ...input.options };
  if (options.maxFeePerGas === undefined) {
    options.maxFeePerGas = await getMaxFeePerGas(targetChainId, targetRpcUrl, input.axiomV2QueryAddress, options);
  }

  const targetChainPublicClient = createPublicClient({
    chain: viemChain(targetChainId, targetRpcUrl),
    transport: http(targetRpcUrl),
  });

  const feeDataExtended = await calculateFeeDataExtended(targetChainId, targetChainPublicClient, input.axiomV2QueryAddress, options);
  const payment = await calculatePayment(targetChainId, targetChainPublicClient, feeDataExtended);

  const config: QueryBuilderClientConfig = {
    sourceChainId,
    rpcUrl: sourceRpcUrl,
    caller: input.caller,
    version: "v2",
    mock: input.mock,
  };
  const queryBuilderClient = new QueryBuilderClient(
    config,
    input.dataQuery.map((dq) => dq.subqueryData),
    input.computeQuery,
    input.callback,
    options,
  );
  queryBuilderClient.setOptions(feeDataExtended);

  // Feed the data query into the query builder 
  if (input.dataQuery.length > 0) {
    queryBuilderClient.setBuiltDataQuery({
      sourceChainId,
      subqueries: input.dataQuery,
    }, true);
  }
  
  const {
    queryHash,
    dataQueryHash,
    computeQuery,
    callback,
    feeData,
    userSalt,
    refundee,
    dataQuery,
  } = await queryBuilderClient.build(validate);
  const id = await queryBuilderClient.getQueryId(input.caller);

  let sendQueryArgs: any;
  if (!input.options.ipfsClient) {
    sendQueryArgs = {
      address: input.axiomV2QueryAddress as `0x${string}`,
      abi: abi,
      functionName: "sendQuery",
      value: payment,
      args: [
        sourceChainId,
        dataQueryHash,
        computeQuery,
        callback,
        feeData,
        userSalt,
        refundee,
        dataQuery,
      ],
      queryId: id,
      mock: queryBuilderClient.config.mock,
    };
  } else {
    const encodedQuery = encodeFullQueryV2(
      sourceChainId,
      refundee,
      {
        sourceChainId,
        subqueries: input.dataQuery,
      },
      computeQuery,
      callback,
      feeData,
      userSalt,
      refundee,
    );
    const pinRes = await input.options.ipfsClient.pin(encodedQuery);
    if (pinRes.status > 299) {
      throw new Error(`Failed to write data to IPFS. Status: ${pinRes.status}`);
    }
    const ipfsHash = pinRes.value as string;
    sendQueryArgs = {
      address: input.axiomV2QueryAddress as `0x${string}`,
      abi: abi,
      functionName: "sendQueryWithIpfsData",
      value: payment,
      args: [
        queryHash,
        ipfsHash,
        callback,
        feeData,
        userSalt,
        refundee,
      ],
      queryId: id,
      mock: queryBuilderClient.config.mock,
    };
  }

  const calldata = encodeFunctionData(sendQueryArgs);
  return {
    ...sendQueryArgs,
    calldata,
  };
};
