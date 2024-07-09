import fs from 'fs';
import path from 'path';
import { JsonRpcProvider } from "ethers";
import { generateCircuitInputs } from './inputs';
import { generateCircuitArtifacts, runTestProve, runTestProveCrosschain, runTestProveSendQuery, runTestProveSendQueryCrosschain } from "./circuitTest";
import { ChainConfig } from '@axiom-crypto/client';

export const run = async (
  input: {
    circuit: string;
    rpcUrl: string;
    data: string;
    circuitInputsPath?: string;
    output?: string;
    function?: string;
    send?: boolean;
    options?: any;
    targetRpcUrl?: string,
  }
): Promise<any> => {
  const chainDataPath = path.dirname(input.data);
  const data = JSON.parse(fs.readFileSync(input.data, 'utf8'));
  const provider = new JsonRpcProvider(input.rpcUrl);
  const chainId = (await provider.getNetwork()).chainId.toString();

  let outputPath = path.join(path.dirname(input.circuit), '../output');
  if (input.output) {
    outputPath = input.output;
  }
  let circuitInputsPath = path.join(chainDataPath, chainId);
  if (input.circuitInputsPath) {
    circuitInputsPath = input.circuitInputsPath;
  }

  // Generate the input values for this circuit file
  generateCircuitInputs(input.circuit, circuitInputsPath, data);

  // Compile the circuit
  const {
    circuit,
    compiledCircuit,
    inputs,
  } = await generateCircuitArtifacts(input.rpcUrl, input.circuit, circuitInputsPath, outputPath);

  let targetChainId = undefined;
  if (input.targetRpcUrl) {
    const targetProvider = new JsonRpcProvider(input.targetRpcUrl);
    targetChainId = (await targetProvider.getNetwork()).chainId.toString();
  }

  // Prove or prove+sendQuery
  if (input.targetRpcUrl) {
    const sourceConfig: ChainConfig = { chainId, rpcUrl: input.rpcUrl };
    const targetConfig: ChainConfig = { chainId: targetChainId!, rpcUrl: input.targetRpcUrl };
    return !input.send ?
      await runTestProveCrosschain(sourceConfig, targetConfig, circuit, compiledCircuit, inputs, input.options) :
      await runTestProveSendQueryCrosschain(sourceConfig, targetConfig, circuit, compiledCircuit, inputs, input.options);
  } else {
    return !input.send ?
      await runTestProve(chainId, input.rpcUrl, circuit, compiledCircuit, inputs, input.options) :
      await runTestProveSendQuery(chainId, input.rpcUrl, circuit, compiledCircuit, inputs, input.options);
  }
};
