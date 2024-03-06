import {
  AxiomSdkCore,
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  AxiomV2QueryOptions,
  DataSubquery,
  QueryBuilderV2,
  QueryV2,
} from "@axiom-crypto/core";
import { encodeFunctionData } from "viem";
import { getMaxFeePerGas } from "./axiom/utils";
import { AxiomV2ClientOptions, AxiomV2SendQueryArgs } from "./types";
import { encodeFullQueryV2 } from "@axiom-crypto/core/packages/tools";

export const buildSendQuery = async (input: {
  axiom: AxiomSdkCore;
  dataQuery: DataSubquery[];
  computeQuery: AxiomV2ComputeQuery;
  callback: AxiomV2Callback;
  caller: string;
  options: AxiomV2ClientOptions;
}): Promise<AxiomV2SendQueryArgs> => {
  const validate = input.options.validate ?? false;
  const query = input.axiom.query as QueryV2;
  if (input.options.refundee === undefined) {
    throw new Error("Refundee is required");
  }
  if (input.options.maxFeePerGas == undefined) {
    input.options.maxFeePerGas = await getMaxFeePerGas(input.axiom);
  }

  const queryOptions: AxiomV2QueryOptions = {
    maxFeePerGas: input.options.maxFeePerGas,
    callbackGasLimit: input.options.callbackGasLimit,
    overrideAxiomQueryFee: input.options.overrideAxiomQueryFee,
    dataQueryCalldataGasWarningThreshold: input.options.dataQueryCalldataGasWarningThreshold,
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
      sourceChainId: input.axiom.config.chainId.toString(),
    }, true);
  }
  const {
    sourceChainId,
    queryHash,
    dataQueryHash,
    computeQuery,
    callback,
    feeData,
    userSalt,
    refundee,
    dataQuery,
  } = await qb.build(validate);
  const payment = await qb.calculateFee();
  const id = await qb.getQueryId(input.caller);
  const abi = input.axiom.getAxiomQueryAbi();
  const axiomQueryAddress = input.options.queryAddress ?? input.axiom.getAxiomQueryAddress();

  let sendQueryArgs: any;
  if (!input.options.ipfsClient) {
    sendQueryArgs = {
      address: axiomQueryAddress as `0x${string}`,
      abi: abi,
      functionName: "sendQuery",
      value: BigInt(payment),
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
      mock: input.axiom.config.mock,
    };
  } else {
    const encodedQuery = encodeFullQueryV2(
      sourceChainId,
      refundee,
      {
        sourceChainId: input.axiom.config.chainId.toString(),
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
