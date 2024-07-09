import fs from "fs";
import path from "path";
import { generateCircuitArtifacts, runTestProve, runTestProveCrosschain, runTestProveSendQuery, runTestProveSendQueryCrosschain } from "./circuitTest"
import { TransactionReceipt } from "viem";
import { generateCircuitInputs } from "./inputs";
import { AxiomCore } from "@axiom-crypto/client/axiom/axiomCore";

export const generateInputs = async (
  circuitPath: string,
  circuitInputsPath: string,
  chainDataPath: string
): Promise<void> => {
  const chainData = JSON.parse(fs.readFileSync(chainDataPath, 'utf8'));
  generateCircuitInputs(circuitPath, circuitInputsPath, chainData);
}

export const compile = async (
  rpcUrl: string,
  circuitPath: string,
  circuitInputsPath: string,
  outputPath: string
): Promise<void> => {
  await generateCircuitArtifacts(rpcUrl, circuitPath, circuitInputsPath, outputPath)
}

export const prove = async (
  chainId: string,
  rpcUrl: string,
  circuitPath: string,
  compiledCircuitPath: string,
  inputsPath: string,
  options?: any,
): Promise<AxiomCore<any, any>> => {
  const circuit = (await import(path.resolve(circuitPath))).circuit;
  const compiledCircuit = await import(path.resolve(compiledCircuitPath));
  const inputs = (await import(path.resolve(inputsPath))).default;
  const crosschain = options.targetRpcUrl && options.targetChainId;
  if (crosschain) {
    return await runTestProveCrosschain(
      { chainId, rpcUrl },
      { chainId: options.targetChainId, rpcUrl: options.targetRpcUrl },
      circuit,
      compiledCircuit,
      inputs,
      options
    );
  } else {
    return await runTestProve(chainId, rpcUrl, circuit, compiledCircuit, inputs, options);
  }
}

export const proveSendQuery = async (
  chainId: string,
  rpcUrl: string,
  circuitPath: string,
  compiledCircuitPath: string,
  inputsPath: string,
  options?: any,
): Promise<[AxiomCore<any, any>, TransactionReceipt]> => {
  const circuit = (await import(path.resolve(circuitPath))).circuit;
  const compiledCircuit = await import(path.resolve(compiledCircuitPath));
  const inputs = (await import(path.resolve(inputsPath))).default;
  const crosschain = options.targetRpcUrl && options.targetChainId;
  if (crosschain) {
    return await runTestProveSendQueryCrosschain(
      { chainId, rpcUrl },
      { chainId: options.targetChainId, rpcUrl: options.targetRpcUrl },
      circuit,
      compiledCircuit,
      inputs,
      options
    );
  } else {
    return await runTestProveSendQuery(chainId, rpcUrl, circuit, compiledCircuit, inputs, options);
  }
}
