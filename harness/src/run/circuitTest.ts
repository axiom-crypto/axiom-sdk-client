import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import path from "path";
import { Axiom, AxiomV2CompiledCircuit, UserInput } from "@axiom-crypto/client";
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

export async function generateCircuitArtifacts(chainId: string, circuitPath: string, outputPath: string) {
  const provider = process.env[`PROVIDER_URI_${chainId}`] as string;
  const circuitPathResolved = path.resolve(circuitPath);
  const pathToFile = path.dirname(circuitPathResolved);
  const filename = path.basename(circuitPathResolved);
  const filebase = filename.split(".")[0];
  const folder = path.basename(path.dirname(circuitPathResolved));
  
  const compiledPath = path.resolve(`${outputPath}/${filebase}.compiled.json`);
  const inputsPath = path.resolve(`${outputPath}/${chainId}/${filebase}.inputs.json`);
  const defaultInputsPath = path.resolve(`${outputPath}/${chainId}/${filebase}.defaultInputs.json`);
  
  let externalDefaults = false;
  if (existsSync(defaultInputsPath)) {
    externalDefaults = true;
    const defaultInputs = (await import(defaultInputsPath)).default;
    console.log("External defaultInputs", defaultInputs);
  }

  if (existsSync(compiledPath)) {
    rmSync(compiledPath);
  }

  execSync(`npx axiom circuit compile ${circuitPathResolved} -o ${compiledPath} ${externalDefaults ? "-d " + defaultInputsPath : ""} -p ${provider}`, { stdio: 'inherit' });

  let inputs = {};
  if (existsSync(inputsPath)) {
    inputs = (await import(inputsPath)).default;
    console.log("Inputs", inputs);
  }

  return {
    circuit: (await import(circuitPathResolved)).circuit,
    compiledCircuit: await import(compiledPath),
    inputs,
  };
}

export async function runTestProve(
  chainId: string,
  circuit: (inputs: UserInput<any>) => Promise<void>,
  compiledCircuit: AxiomV2CompiledCircuit,
  inputs: UserInput<any>,
  options?: object,
): Promise<Axiom<any>> {
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

export async function runTestSendQuery(
  chainId: string,
  circuit: (inputs: any) => Promise<void>,
  compiledCircuit: AxiomV2CompiledCircuit,
  inputs: UserInput<any>,
  options?: object,
): Promise<TransactionReceipt> {
  const axiom = await runTestProve(chainId, circuit, compiledCircuit, inputs, options);
  const receipt = await axiom.sendQuery();
  return receipt;
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
