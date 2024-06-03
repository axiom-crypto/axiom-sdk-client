import fs from 'fs';
import path from 'path';
import { JsonRpcProvider } from "ethers";
import { generateCircuitArtifacts, runTestProve, runTestProveSendQuery } from "./circuitTest";
import { generateInputs } from './inputs';

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

  // Geneate the input values for this circuit file
  generateInputs(input.circuit, circuitInputsPath, data);
  
  // Compile the circuit
  const { 
    circuit,
    compiledCircuit,
    inputs,
  } = await generateCircuitArtifacts(input.rpcUrl, input.circuit, circuitInputsPath, outputPath);

  // Prove or prove+sendQuery
  if (!input.send) {
    return await runTestProve(chainId, input.rpcUrl, circuit, compiledCircuit, inputs, input.options);
  } else {
    return await runTestProveSendQuery(chainId, input.rpcUrl, circuit, compiledCircuit, inputs, input.options);
  }
};
