import fs from "fs";
import path from "path";
import { generateCircuitArtifacts, runTestProve, runTestProveSendQuery } from "./circuitTest"
import { TransactionReceipt } from "viem";
import { Axiom } from "@axiom-crypto/client";
import { generateCircuitInputs } from "./inputs";

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
): Promise<Axiom<any>> => {
  const circuit = (await import(path.resolve(circuitPath))).circuit;
  const compiledCircuit = await import(path.resolve(compiledCircuitPath));
  const inputs = (await import(path.resolve(inputsPath))).default;
  return await runTestProve(chainId, rpcUrl, circuit, compiledCircuit, inputs, options);
}

export const proveSendQuery = async (
  chainId: string,
  rpcUrl: string,
  circuitPath: string,
  compiledCircuitPath: string,
  inputsPath: string,
  options?: any,
): Promise<TransactionReceipt> => {
  const circuit = (await import(path.resolve(circuitPath))).circuit;
  const compiledCircuit = await import(path.resolve(compiledCircuitPath));
  const inputs = (await import(path.resolve(inputsPath))).default;
  return await runTestProveSendQuery(chainId, rpcUrl, circuit, compiledCircuit, inputs, options);
}
