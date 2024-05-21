import path from 'path';
import { getRpcUrl, readJsonFromFile, saveJsonToFile } from "@axiom-crypto/circuit/cliHandler/utils";
import { buildSendQuery } from "../sendQuery";
import { argsArrToObj } from '../axiom/utils';
import {
  getAxiomV2QueryAddress,
  getAxiomV2QueryBlockhashOracleAddress,
  getAxiomV2QueryBroadcasterAddress,
} from '../lib';
import { ChainConfig } from '../types';

export const queryParams = async (
  callbackTarget: string,
  options: {
    refundAddress: string;
    sourceChainId: string;
    targetChainId?: string;
    bridgeId?: number;
    callbackExtraData?: string;
    caller?: string;
    argsMap?: boolean;
    outputs?: string;
    proven?: string;
    rpcUrl?: string;
    targetRpcUrl?: string;
    maxFeePerGas?: string;
    callbackGasLimit?: number;
    mock?: boolean;
    broadcaster?: boolean;
    blockhashOracle?: boolean;
  },
) => {
  let defaultPath = path.resolve(path.join("app", "axiom"));
  let provenFile = path.join(defaultPath, "data", "proven.json");
  if (options.proven !== undefined) {
      provenFile = options.proven;
  }

  if (options.broadcaster && options.blockhashOracle) {
    throw new Error("Cannot use --broadcaster and --blockhashOracle at the same time");
  }

  // Get AxiomV2Query address
  let axiomV2QueryAddress;
  if (options.broadcaster) {
    if (!options.targetChainId ) {
      throw new Error("`targetChainId` is required for broadcaster bridge type");
    }
    if (!options.bridgeId) {
      throw new Error("`bridgeId` is required for broadcaster bridge type");
    }
    axiomV2QueryAddress = getAxiomV2QueryBroadcasterAddress(options.sourceChainId, options.targetChainId, options.bridgeId);
  } else if (options.blockhashOracle) {
    if (!options.targetChainId) {
      throw new Error("`targetChainId` is required for blockhash oracle bridge type");
    }
    axiomV2QueryAddress = getAxiomV2QueryBlockhashOracleAddress(options.sourceChainId, options.targetChainId);
  } else {
    axiomV2QueryAddress = getAxiomV2QueryAddress(options.sourceChainId);
  }

  let target: ChainConfig | undefined;
  if (options.targetChainId || options.targetRpcUrl) {
    if (!options.targetChainId || !options.targetRpcUrl) {
      throw new Error("`targetChainId` and `targetRpcUrl` must be provided together");
    }
    target = {
      chainId: options.targetChainId,
      rpcUrl: options.targetRpcUrl,
    }
  }

  console.log(`Reading proven circuit JSON from: ${provenFile}`)
  const provenJson = readJsonFromFile(provenFile);
  const rpcUrl = getRpcUrl(options.rpcUrl);
  try {
    let build = await buildSendQuery({
      chainId: options.sourceChainId,
      rpcUrl,
      axiomV2QueryAddress,
      dataQuery: provenJson.dataQuery,
      computeQuery: provenJson.computeQuery,
      callback: {
        target: callbackTarget,
        extraData: options.callbackExtraData ?? "0x",
      },
      caller: options.caller ?? options.refundAddress,
      mock: options.mock ?? false,
      options: {
        maxFeePerGas: options.maxFeePerGas,
        callbackGasLimit: options.callbackGasLimit,
      },
      target,
    });
    build.value = build.value.toString() as any;
    const res = {
      value: build.value,
      mock: build.mock,
      queryId: build.queryId,
      args: options.argsMap ? argsArrToObj(build.args) : build.args,
      calldata: build.calldata,
    };
    let outputsFile = path.join(defaultPath, "data", "sendQuery.json");
    if (options.outputs !== undefined) {
        outputsFile = options.outputs;
    }
    saveJsonToFile(res, outputsFile);
  } catch (e) {
    console.error(e);
  }
};
