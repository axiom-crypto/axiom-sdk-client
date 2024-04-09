import fs from 'fs';
import path from 'path';
import { JsonRpcProvider } from "ethers";
import { generateCircuitArtifacts, runTestProve, runTestSendQuery } from "./circuitTest";
import { generateInputs } from './inputs';

export const run = async (
  options: {
    circuit: string;
    provider: string;
    data: string;
    outputs?: string;
    function?: string;
    send?: boolean;
    options?: any;
  }
): Promise<any> => {
  const data = JSON.parse(fs.readFileSync(options.data, 'utf8'));
  const provider = new JsonRpcProvider(options.provider);
  const chainId = (await provider.getNetwork()).chainId.toString();

  let outputPath = path.join(path.dirname(options.circuit), '../output');
  if (options.outputs) {
    outputPath = options.outputs;
  }
  // Geneate the input values for this circuit file
  generateInputs(options.circuit, outputPath, data);
  
  // Compile the circuit
  const { 
    circuit,
    compiledCircuit,
    inputs,
  } = await generateCircuitArtifacts(chainId, options.circuit, outputPath);

  // Prove or prove+send the query
  if (!options.send) {
    return await runTestProve(chainId, circuit, compiledCircuit, inputs, options.options);
  } else {
    return await runTestSendQuery(chainId, circuit, compiledCircuit, inputs, options.options);
  }
};
