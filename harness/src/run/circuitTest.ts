import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import path from "path";
import { Axiom, AxiomCrosschain, AxiomV2CompiledCircuit, BridgeType, ChainConfig, UserInput } from "@axiom-crypto/client";
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

export async function generateCircuitArtifacts(
  rpcUrl: string,
  circuitPath: string,
  circuitInputsPath: string,
  outputPath: string,
) {
  const circuitPathResolved = path.resolve(circuitPath);
  const pathToFile = path.dirname(circuitPathResolved);
  const filename = path.basename(circuitPathResolved);
  const filebase = filename.split(".")[0];
  const folder = path.basename(path.dirname(circuitPathResolved));

  const compiledPath = path.resolve(`${outputPath}/${filebase}.compiled.json`);
  const inputsPath = path.resolve(`${circuitInputsPath}/${filebase}.inputs.json`);
  const defaultInputsPath = path.resolve(`${circuitInputsPath}/${filebase}.defaultInputs.json`);

  let externalDefaults = false;
  if (existsSync(defaultInputsPath)) {
    externalDefaults = true;
  }

  if (existsSync(compiledPath)) {
    rmSync(compiledPath);
  }

  execSync(`npx axiom circuit compile ${circuitPathResolved} -o ${compiledPath} ${externalDefaults ? "-d " + defaultInputsPath : ""} -sr ${rpcUrl}`, { stdio: 'inherit' });

  if (externalDefaults) {
    const defaultInputs = (await import(defaultInputsPath)).default;
    console.log("External defaultInputs:", defaultInputsPath, defaultInputs);
  }

  let inputs = {};
  if (existsSync(inputsPath)) {
    inputs = (await import(inputsPath)).default;
    console.log("Inputs:", inputsPath, inputs);
  }

  return {
    circuit: (await import(circuitPathResolved)).circuit,
    compiledCircuit: await import(compiledPath),
    inputs,
  };
}

export async function runTestProve(
  chainId: string,
  rpcUrl: string,
  circuit: (inputs: UserInput<any>) => Promise<void>,
  compiledCircuit: AxiomV2CompiledCircuit,
  inputs: UserInput<any>,
  options?: any,
): Promise<Axiom<any>> {
  let targetOverride = undefined;
  if (options?.callback?.target !== undefined) {
    targetOverride = options.callback.target;
  }
  const axiom = new Axiom({
    circuit,
    compiledCircuit,
    chainId,
    rpcUrl,
    privateKey: process.env[`PRIVATE_KEY_${chainId}`] as string,
    callback: {
      target: getCallbackTarget(chainId, targetOverride),
    },
    ...options,
  });
  await axiom.init();
  await axiom.prove(inputs);
  return axiom;
}

export async function runTestProveCrosschain(
  source: ChainConfig,
  target: ChainConfig,
  circuit: (inputs: UserInput<any>) => Promise<void>,
  compiledCircuit: AxiomV2CompiledCircuit,
  inputs: UserInput<any>,
  options?: any,
): Promise<AxiomCrosschain<any>> {
  let callbackTargetOverride = undefined;
  if (options?.callback?.target !== undefined) {
    callbackTargetOverride = options.callback.target;
  }
  const axiom = new AxiomCrosschain({
    circuit,
    compiledCircuit,
    source,
    target: {
      chainId: target.chainId,
      rpcUrl: target.rpcUrl,
      privateKey: process.env[`PRIVATE_KEY_${target.chainId}`] as string,
    },
    bridgeType: BridgeType.BlockhashOracle,
    callback: {
      target: getCallbackTarget(target.chainId, callbackTargetOverride),
    },
    ...options,
  });
  await axiom.init();
  await axiom.prove(inputs);
  return axiom;
}

export async function runTestProveSendQuery(
  chainId: string,
  rpcUrl: string,
  circuit: (inputs: any) => Promise<void>,
  compiledCircuit: AxiomV2CompiledCircuit,
  inputs: UserInput<any>,
  options?: object,
): Promise<[Axiom<any>, TransactionReceipt]> {
  const axiom = await runTestProve(chainId, rpcUrl, circuit, compiledCircuit, inputs, options);
  const receipt = await axiom.sendQuery();
  return [axiom, receipt];
}

export function getCallbackTarget(chainId: string, override?: string) {
  if (override) {
    return override;
  }
  switch (chainId) {
    case "1":
      return "0x4D36100eA7BD6F685Fd44EB6BE5ccE7A92047581";
    case "11155111":
      return "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e";
    default:
      throw new Error(`No target found for chainId: ${chainId}`);
  }
}

export async function runTestProveSendQueryCrosschain(
  source: ChainConfig,
  target: ChainConfig,
  circuit: (inputs: UserInput<any>) => Promise<void>,
  compiledCircuit: AxiomV2CompiledCircuit,
  inputs: UserInput<any>,
  options?: any,
): Promise<[AxiomCrosschain<any>, TransactionReceipt]> {
  const axiom = await runTestProveCrosschain(source, target, circuit, compiledCircuit, inputs, options);
  const receipt = await axiom.sendQuery();
  return [axiom, receipt];
}
