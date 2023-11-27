import { Axiom, AxiomV2Callback, AxiomV2ComputeQuery, DataSubquery, QueryBuilderV2, QueryV2 } from "@axiom-crypto/core";
import { getRandom32Bytes } from "./utils";
import { encodeFunctionData } from "viem";

export const buildSendQuery = async (input: {
    axiom: Axiom,
    dataQuery: DataSubquery[],
    computeQuery: AxiomV2ComputeQuery,
    callback: AxiomV2Callback,
    refundAddress: string;
}) => {
    const query = input.axiom.query as QueryV2;
    const qb: QueryBuilderV2 = query.new(undefined, input.computeQuery, input.callback);
    if (input.dataQuery.length > 0) {
        qb.setBuiltDataQuery({ subqueries: input.dataQuery, sourceChainId: input.axiom.config.chainId.toString() });
    }
    const {
        dataQueryHash,
        dataQuery,
        computeQuery,
        callback,
        maxFeePerGas,
        callbackGasLimit,
        sourceChainId,
    } = await qb.build();
    const payment = await qb.calculateFee();
    const salt = getRandom32Bytes();
    const abi = input.axiom.getAxiomQueryAbi();
    const axiomQueryAddress = input.axiom.getAxiomQueryAddress();
    const args = [sourceChainId, dataQueryHash, computeQuery, callback, salt, maxFeePerGas, callbackGasLimit, input.refundAddress, dataQuery]
    const sendQueryArgs = {
        address: axiomQueryAddress as `0x${string}`,
        abi: abi,
        functionName: 'sendQuery',
        value: BigInt(payment),
        args
    };

    const calldata = encodeFunctionData(sendQueryArgs);
    return {
        ...sendQueryArgs,
        calldata
    }

} 