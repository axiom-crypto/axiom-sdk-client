import fs from 'fs';
import path from 'path';
import { JsonRpcProvider } from "ethers";
import { generateCircuitArtifacts, runTestProve, runTestSendQuery } from "./circuitTest";
import { generateInputs } from './inputs';

export const run = async (
  options: {
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
  const chainDataPath = path.dirname(options.data);
  const data = JSON.parse(fs.readFileSync(options.data, 'utf8'));
  const provider = new JsonRpcProvider(options.rpcUrl);
  const chainId = (await provider.getNetwork()).chainId.toString();

  let outputPath = path.join(path.dirname(options.circuit), '../output');
  if (options.output) {
    outputPath = options.output;
  }
  let circuitInputsPath = path.join(chainDataPath, chainId);
  if (options.circuitInputsPath) {
    circuitInputsPath = options.circuitInputsPath;
  }

  // Geneate the input values for this circuit file
  generateInputs(options.circuit, circuitInputsPath, data);
  
  // Compile the circuit
  const { 
    circuit,
    compiledCircuit,
    inputs,
  } = await generateCircuitArtifacts(options.rpcUrl, options.circuit, circuitInputsPath, outputPath);

  // Prove or prove+send the query
  if (!options.send) {
    return await runTestProve(chainId, options.rpcUrl, circuit, compiledCircuit, inputs, options.options);
  } else {
    return await runTestSendQuery(chainId, options.rpcUrl, circuit, compiledCircuit, inputs, options.options);
  }
};
