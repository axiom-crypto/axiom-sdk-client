import {
  AxiomSdkCore,
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  AxiomV2QueryOptions,
  DataSubquery,
  QueryBuilderV2,
  QueryV2,
} from "@axiom-crypto/core";
import { createPublicClient, encodeFunctionData, http } from "viem";
import { getMaxFeePerGas } from "./axiom/utils";
import { AbiType, AxiomV2ClientOptions, AxiomV2SendQueryArgs } from "./types";
import { encodeFullQueryV2 } from "@axiom-crypto/core/packages/tools";
import { calculatePayment } from "./lib/paymentCalc";
import { viemChain } from "./lib/viem";
import { getAxiomV2Abi, getAxiomV2QueryAddress } from "./lib";

export const buildSendQuery = async (input: {
  axiom: AxiomSdkCore;
  dataQuery: DataSubquery[];
  computeQuery: AxiomV2ComputeQuery;
  callback: AxiomV2Callback;
  caller: string;
  options: AxiomV2ClientOptions;
}): Promise<AxiomV2SendQueryArgs> => {
  const validate = input.options?.overrides?.validateBuild ?? true;
  const query = input.axiom.query as QueryV2;
  if (input.options.refundee === undefined) {
    throw new Error("Refundee is required");
  }
  if (input.options.maxFeePerGas == undefined) {
    input.options.maxFeePerGas = await getMaxFeePerGas(input.axiom, input.options?.overrides);
  }
  const chainId = input.axiom.config.chainId.toString();

  const queryOptions: AxiomV2QueryOptions = {
    maxFeePerGas: input.options.maxFeePerGas,
    callbackGasLimit: input.options.callbackGasLimit,
    overrideAxiomQueryFee: input.options.overrideAxiomQueryFee,
    refundee: input.options.refundee,
  };
  const qb: QueryBuilderV2 = query.new(
    undefined,
    input.computeQuery,
    input.callback,
    queryOptions
  );

  if (input.dataQuery.length > 0) {
    qb.setBuiltDataQuery({
      subqueries: input.dataQuery,
      sourceChainId: chainId,
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
  } = await qb.build(validate);
  const id = await qb.getQueryId(input.caller);
  const abi = getAxiomV2Abi(AbiType.Query);
  const axiomQueryAddress = input.options?.overrides?.queryAddress ?? getAxiomV2QueryAddress(chainId);

  const publicClient = createPublicClient({
    chain: viemChain(chainId, input.axiom.config.providerUri),
    transport: http(input.axiom.config.providerUri),
  });
  const payment = await calculatePayment(chainId, publicClient, input.options);

  let sendQueryArgs: any;
  if (!input.options.ipfsClient) {
    sendQueryArgs = {
      address: axiomQueryAddress as `0x${string}`,
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
      mock: input.axiom.config.mock,
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
      mock: input.axiom.config.mock,
    };
  }

  const calldata = encodeFunctionData(sendQueryArgs);
  return {
    ...sendQueryArgs,
    calldata,
  };
};
