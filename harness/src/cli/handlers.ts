import path from "path";
import { generateCircuitArtifacts, runTestProve, runTestSendQuery } from "../run"

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
): Promise<void> => {
  const circuit = (await import(path.resolve(circuitPath))).circuit;
  const compiledCircuit = await import(path.resolve(compiledCircuitPath));
  const inputs = (await import(path.resolve(inputsPath))).default;
  await runTestProve(chainId, rpcUrl, circuit, compiledCircuit, inputs, options);
}

export const sendQuery = async (
  chainId: string,
  rpcUrl: string,
  circuitPath: string,
  compiledCircuitPath: string,
  inputsPath: string,
  options?: any,
): Promise<void> => {
  const circuit = (await import(path.resolve(circuitPath))).circuit;
  const compiledCircuit = await import(path.resolve(compiledCircuitPath));
  const inputs = (await import(path.resolve(inputsPath))).default;
  await runTestSendQuery(chainId, rpcUrl, circuit, compiledCircuit, inputs, options);
}
