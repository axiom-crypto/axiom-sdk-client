import {
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  DataSubquery,
} from "@axiom-crypto/circuit";
import { createPublicClient, encodeFunctionData, http } from "viem";
import { getMaxFeePerGas } from "./axiom/utils";
import { AbiType, AxiomV2QueryOptions, AxiomV2SendQueryArgs } from "./types";
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
}): Promise<AxiomV2SendQueryArgs> => {
  const validate = input.options?.overrides?.validateBuild ?? true;
  if (input.caller === "") {
    throw new Error("`caller` is required");
  }
  let options = { ...input.options };
  if (options.maxFeePerGas == undefined) {
    options.maxFeePerGas = await getMaxFeePerGas(input.chainId, input.rpcUrl, input.axiomV2QueryAddress);
  }

  const chainId = input.chainId;
  const abi = getAxiomV2Abi(AbiType.Query);

  const publicClient = createPublicClient({
    chain: viemChain(chainId, input.rpcUrl),
    transport: http(input.rpcUrl),
  });

  const feeDataExtended = await calculateFeeDataExtended(chainId, publicClient, input.axiomV2QueryAddress, options);
  const payment = await calculatePayment(chainId, publicClient, feeDataExtended);

  const config: QueryBuilderClientConfig = {
    sourceChainId: chainId,
    rpcUrl: input.rpcUrl,
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
      sourceChainId: chainId,
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
        chainId,
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
      chainId,
      refundee,
      {
        sourceChainId: chainId,
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
