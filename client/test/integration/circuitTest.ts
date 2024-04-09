import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import path from "path";
import { Axiom } from "../../src";
import { TransactionReceipt } from "viem";

export function parseArgs(): { chainId: string } {
  let args: { chainId: string } = { chainId: "" };
  console.log(process.argv);
  process.argv.map((arg) => {
    let [key, value] = arg.split("=");
    key = key.replace("--", "");
    args[key as keyof typeof args] = value;
  });
  if (args["chainId"] === undefined) {
    throw new Error("`chainId` argument is required");
  }
  return args;
}

export async function runTestProve(chainId: string, circuitPath: string, options?: object): Promise<Axiom<any>> {
  const { circuit, compiledCircuit, inputs } = await generateCircuit(chainId, circuitPath);

  const axiom = new Axiom({
    circuit,
    compiledCircuit,
    chainId,
    provider: process.env[`PROVIDER_URI_${chainId}`] as string,
    privateKey: process.env[`PRIVATE_KEY_${chainId}`] as string,
    callback: {
      target: getTarget(chainId),
    },
    ...options,
  });
  await axiom.init();
  await axiom.prove(inputs);
  return axiom;
}

export async function runTestSendQuery(chainId: string, circuitPath: string, options?: object): Promise<TransactionReceipt> {
  const axiom = await runTestProve(chainId, circuitPath, options);
  const receipt = await axiom.sendQuery();
  return receipt;
}

export async function generateCircuit(chainId: string, circuitPath: string) {
  const provider = process.env[`PROVIDER_URI_${chainId}`];
  if (!provider) {
    throw new Error(`PROVIDER_URI_${chainId} environment variable required`);
  }

  const [folder, fileBase] = circuitPath.split("/");
  
  const circuitFile = path.resolve(`./test/integration/circuits/${circuitPath}.circuit.ts`);
  const compiledPath = path.resolve(`./test/integration/circuits/output/${circuitPath}.compiled.json`);
  const inputsPath = path.resolve(`./test/integration/circuits/${folder}/${chainId}/${fileBase}.inputs.json`);
  const defaultInputsPath = path.resolve(`./test/integration/circuits/${folder}/${chainId}/${fileBase}.defaultInputs.json`);
  
  let externalDefaults = false;
  if (existsSync(defaultInputsPath)) {
    externalDefaults = true;
  }

  if (existsSync(compiledPath)) {
    rmSync(compiledPath);
  }
  execSync(`node ./dist/cli/index.js circuit compile ${circuitFile} -o ${compiledPath} ${externalDefaults ? "-d " + defaultInputsPath : ""} -p ${provider}`, { stdio: 'inherit' });

  let inputs = {};
  if (existsSync(inputsPath)) {
    inputs = (await import(inputsPath)).default;
  }

  return {
    circuit: (await import(circuitFile)).circuit,
    compiledCircuit: await import(compiledPath),
    inputs,
  };
}

export function getTarget(chainId: string, override?: string) {
  if (override) {
    return override;
  }
  switch(chainId) {
    case "11155111":
      return "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e";
    case "84532":
      return "0x3b49DE82B86d677C072Dcc7ED47bcA9F20f0CF46";
    default:
      throw new Error(`No target found for chainId: ${chainId}`);
  }
}
