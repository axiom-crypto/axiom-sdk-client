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

export const buildSendQuery = async (input: {
  axiom: AxiomSdkCore;
  dataQuery: DataSubquery[];
  computeQuery: AxiomV2ComputeQuery;
  callback: AxiomV2Callback;
  caller: string;
  options: AxiomV2QueryOptions;
}) => {
  const query = input.axiom.query as QueryV2;
  if (input.options.refundee === undefined) {
    throw new Error("Refundee is required");
  }
  if (input.options.maxFeePerGas == undefined) {
    const feeData = await input.axiom.config.provider.getFeeData();
    input.options.maxFeePerGas = feeData.maxFeePerGas?.toString();
  }
  const qb: QueryBuilderV2 = query.new(
    undefined,
    input.computeQuery,
    input.callback,
    input.options,
  );

  if (input.dataQuery.length > 0) {
    qb.setBuiltDataQuery({
      subqueries: input.dataQuery,
      sourceChainId: input.axiom.config.chainId.toString(),
    });
  }
  const {
    sourceChainId,
    dataQueryHash,
    computeQuery,
    callback,
    feeData,
    userSalt,
    refundee,
    dataQuery,
  } = await qb.build(true);
  const payment = await qb.calculateFee();
  const id = await qb.getQueryId(input.caller);
  const abi = input.axiom.getAxiomQueryAbi();
  const axiomQueryAddress = input.axiom.getAxiomQueryAddress();
  const args = [
    sourceChainId,
    dataQueryHash,
    computeQuery,
    callback,
    feeData,
    userSalt,
    refundee,
    dataQuery,
  ];
  const sendQueryArgs = {
    address: axiomQueryAddress as `0x${string}`,
    abi: abi,
    functionName: "sendQuery",
    value: BigInt(payment),
    args,
    queryId: id,
    mock: input.axiom.config.mock,
  };

  const calldata = encodeFunctionData(sendQueryArgs);
  return {
    ...sendQueryArgs,
    calldata,
  };
};
