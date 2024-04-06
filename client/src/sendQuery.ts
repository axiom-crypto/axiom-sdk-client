import {
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  AxiomV2QueryOptions,
  DataSubquery,
  AxiomV2QueryBuilder,
} from "@axiom-crypto/circuit";
import { createPublicClient, encodeFunctionData, http } from "viem";
import { getMaxFeePerGas } from "./axiom/utils";
import { AbiType, AxiomV2ClientOptions, AxiomV2SendQueryArgs } from "./types";
import { encodeFullQueryV2 } from "@axiom-crypto/core/packages/tools";
import { calculateFeeDataExtended, calculatePayment } from "./lib/paymentCalc";
import { viemChain } from "./lib/viem";
import { getAxiomV2Abi, getAxiomV2QueryAddress } from "./lib";

export const buildSendQuery = async (input: {
  axiom: AxiomV2QueryBuilder;
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
    input.options.maxFeePerGas = await getMaxFeePerGas(input.axiom, input.options?.overrides);
  }

  const chainId = input.axiom.config.chainId.toString();
  const axiomQueryAddress = input.options?.overrides?.queryAddress ?? getAxiomV2QueryAddress(chainId);
  const abi = getAxiomV2Abi(AbiType.Query);

  const publicClient = createPublicClient({
    chain: viemChain(chainId, input.axiom.config.providerUri),
    transport: http(input.axiom.config.providerUri),
  });

  const feeDataExtended = await calculateFeeDataExtended(chainId, publicClient, input.options);
  const payment = await calculatePayment(chainId, publicClient, feeDataExtended);

  const queryOptions: AxiomV2QueryOptions = {
    ...feeDataExtended,
    refundee: input.options.refundee,
  };

  input.axiom = new AxiomV2QueryBuilder(
    undefined,
    input.computeQuery,
    input.callback,
    queryOptions
  );

  if (input.dataQuery.length > 0) {
    input.axiom.setBuiltDataQuery({
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
  } = await input.axiom.build(validate);
  const id = await input.axiom.getQueryId(input.caller);

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
      mock: input.axiom.config.mock,
    };
  }

  const calldata = encodeFunctionData(sendQueryArgs);
  return {
    ...sendQueryArgs,
    calldata,
  };
};
