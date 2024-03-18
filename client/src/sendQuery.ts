import {
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  AxiomV2QueryOptions,
  DataSubquery,
  AxiomV2QueryBuilder,
  AxiomV2QueryBuilderConfig,
} from "@axiom-crypto/circuit";
import { createPublicClient, encodeFunctionData, http } from "viem";
import { getMaxFeePerGas } from "./axiom/utils";
import { AbiType, AxiomV2ClientOptions, AxiomV2SendQueryArgs } from "./types";
import { encodeFullQueryV2 } from "@axiom-crypto/core/packages/tools";
import { calculatePayment } from "./lib/paymentCalc";
import { viemChain } from "./lib/viem";
import { getAxiomV2Abi, getAxiomV2QueryAddress } from "./lib";

export const buildSendQuery = async (input: {
  queryBuilder: AxiomV2QueryBuilder;
  dataQuery: DataSubquery[];
  computeQuery: AxiomV2ComputeQuery;
  callback: AxiomV2Callback;
  caller: string;
  options: AxiomV2ClientOptions;
}): Promise<AxiomV2SendQueryArgs> => {
  const validate = input.options?.overrides?.validateBuild ?? true;
  if (input.options.refundee === undefined) {
    throw new Error("Refundee is required");
  }
  if (input.options.maxFeePerGas == undefined) {
    input.options.maxFeePerGas = await getMaxFeePerGas(input.queryBuilder, input.options?.overrides);
  }
  const sourceChainId = input.queryBuilder.config.sourceChainId.toString();

  const config: AxiomV2QueryBuilderConfig = {
    provider: input.queryBuilder.config.providerUri,
    sourceChainId: input.queryBuilder.config.sourceChainId.toString(),
    targetChainId: input.queryBuilder.config.targetChainId.toString(),
    version: input.queryBuilder.config.version,
    mock: input.queryBuilder.config.mock,
    refundee: input.options.refundee ?? input.caller,
  };
  const queryOptions: AxiomV2QueryOptions = {
    maxFeePerGas: input.options.maxFeePerGas,
    callbackGasLimit: input.options.callbackGasLimit,
    overrideAxiomQueryFee: input.options.overrideAxiomQueryFee,
  };
  input.queryBuilder = new AxiomV2QueryBuilder(
    config,
    undefined,  // we set this as a setBuiltDataQuery below
    input.computeQuery,
    input.callback,
    queryOptions,
  );
  if (input.dataQuery.length > 0) {
    input.queryBuilder.setBuiltDataQuery({
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
  } = await input.queryBuilder.build(validate);
  const id = await input.queryBuilder.getQueryId(input.caller);
  const abi = getAxiomV2Abi(AbiType.Query);
  const axiomQueryAddress = input.options?.overrides?.queryAddress ?? getAxiomV2QueryAddress(sourceChainId);

  const publicClient = createPublicClient({
    chain: viemChain(sourceChainId, input.queryBuilder.config.providerUri),
    transport: http(input.queryBuilder.config.providerUri),
  });
  const payment = await calculatePayment(axiomQueryAddress, publicClient, input.options);

  let sendQueryArgs: any;
  if (!input.options.ipfsClient) {
    sendQueryArgs = {
      address: axiomQueryAddress as `0x${string}`,
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
      mock: input.queryBuilder.config.mock,
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
    if (pinRes.status - 200 > 99) {
      throw new Error(`Failed to write data to IPFS. Status: ${pinRes.status}`);
    }
    const ipfsHash = pinRes.value as string;
    sendQueryArgs = {
      address: axiomQueryAddress as `0x${string}`,
      abi: abi,
      functionName: "sendQueryWithIpfsData",
      value: BigInt(payment),
      args: [
        queryHash,
        ipfsHash,
        callback,
        feeData,
        userSalt,
        refundee,
      ],
      queryId: id,
      mock: input.queryBuilder.config.mock,
    };
  }

  const calldata = encodeFunctionData(sendQueryArgs);
  return {
    ...sendQueryArgs,
    calldata,
  };
};
