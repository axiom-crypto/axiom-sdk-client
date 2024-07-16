import { prove, proveSendQuery } from "../run";

export const handleProve = async (
  chainId: string,
  rpcUrl: string,
  circuitPath: string,
  compiledCircuitPath: string,
  inputsPath: string,
  options?: any,
): Promise<void> => {
  await prove(chainId, rpcUrl, circuitPath, compiledCircuitPath, inputsPath, options);
}

export const handleProveSendQuery = async (
  chainId: string,
  rpcUrl: string,
  circuitPath: string,
  compiledCircuitPath: string,
  inputsPath: string,
  options?: any,
): Promise<void> => {
  await proveSendQuery(chainId, rpcUrl, circuitPath, compiledCircuitPath, inputsPath, options);
}