import {
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  AxiomV2QueryOptions,
  DataSubquery,
  AxiomV2QueryBuilder,
} from "@axiom-crypto/circuit";
import { encodeFunctionData } from "viem";
import { getMaxFeePerGas } from "./axiom/utils";
import { AxiomV2ClientOptions, AxiomV2SendQueryArgs } from "./types";
import { encodeFullQueryV2 } from "@axiom-crypto/core/packages/tools";

export const buildSendQuery = async (input: {
  axiom: AxiomV2QueryBuilder;
  dataQuery: DataSubquery[];
  computeQuery: AxiomV2ComputeQuery;
  callback: AxiomV2Callback;
  caller: string;
  options: AxiomV2ClientOptions;
}): Promise<AxiomV2SendQueryArgs> => {
  const validate = input.options.validate ?? false;
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
    refundee: input.options.refundee,
  };
  const qb: AxiomV2QueryBuilder = query.new(
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
