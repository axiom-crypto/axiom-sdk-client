import path from 'path';
import { getRpcUrl, readJsonFromFile, saveJsonToFile } from "@axiom-crypto/circuit/cliHandler/utils";
import { buildSendQuery } from "../sendQuery";
import { argsArrToObj } from '../axiom/utils';
import {
  getAxiomV2QueryAddress,
  getAxiomV2QueryBlockhashOracleAddress,
  getAxiomV2QueryBroadcasterAddress,
} from '../lib';
import { ChainConfig } from 'src/types';

export const queryParams = async (
  callbackTarget: string,
  options: {
    refundAddress: string;
    sourceChainId: string;
    callbackExtraData?: string;
    caller?: string;
    argsMap?: boolean;
    outputs?: string;
    proven?: string;
    rpcUrl?: string;
    maxFeePerGas?: string;
    callbackGasLimit?: number;
    mock?: boolean;

    // Crosschain options
    targetRpcUrl?: string;
    targetChainId?: string;
    bridgeId?: number;
    isBroadcaster?: boolean;
    isBlockhashOracle?: boolean;
  },
) => {
  let defaultPath = path.resolve(path.join("app", "axiom"));
  let provenFile = path.join(defaultPath, "data", "proven.json");
  if (options.proven !== undefined) {
      provenFile = options.proven;
  }

  let isCrosschain = false;
  if (options.targetRpcUrl || options.targetChainId || options.bridgeId || options.isBroadcaster || options.isBlockhashOracle) {
    isCrosschain = true;
  }

  let target: ChainConfig | undefined;
  let axiomV2QueryAddress = getAxiomV2QueryAddress(options.sourceChainId);
  if (isCrosschain) {
    // Get AxiomV2Query address
    if (options.isBroadcaster) {
      if (options.isBlockhashOracle) {
        throw new Error("Cannot use `--isBroadcaster` and `--isBlockhashOracle` at the same time");
      }
      if (!options.targetChainId) {
        throw new Error("`targetChainId` is required for broadcaster bridge type");
      }
      if (!options.bridgeId) {
        throw new Error("`bridgeId` is required for broadcaster bridge type");
      }
      axiomV2QueryAddress = getAxiomV2QueryBroadcasterAddress({
        targetChainId: options.targetChainId,
        sourceChainId: options.sourceChainId,
        bridgeId: options.bridgeId,
      });
    } else if (options.isBlockhashOracle) {
      if (!options.targetChainId) {
        throw new Error("`targetChainId` is required for blockhash oracle bridge type");
      }
      axiomV2QueryAddress = getAxiomV2QueryBlockhashOracleAddress({
        targetChainId: options.targetChainId,
        sourceChainId: options.sourceChainId,
      });
    } else {
      throw new Error("Need to set either `--isBroadcaster` or `--isBlockhashOracle` for crosschain query");
    }
  
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
    const res = {
      value: build.value.toString(),
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
