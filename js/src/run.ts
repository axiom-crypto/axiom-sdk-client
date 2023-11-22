import { JsonRpcProvider } from "ethers";
import { getCircuitValue256Witness, getCircuitValueWitness } from "./utils";
import { SUBQUERY_NUM_INSTANCES, USER_COMPUTE_NUM_INSTANCES } from "./constants";
import { getInputFunctionSignature } from "@axiom-crypto/halo2-lib-js/shared/utils";
import { autoConfigCircuit, CircuitConfig } from "@axiom-crypto/halo2-lib-js";
import { Halo2Wasm, Halo2LibWasm } from "@axiom-crypto/halo2-lib-js/wasm/web";

const parseDataInputs = (inputs: string) => {
  let parsedInputs = JSON.parse(inputs);
  let parsedInputKeys = Object.keys(parsedInputs);
  for (let key of parsedInputKeys) {
    let val = parsedInputs[key];
    if (Array.isArray(val)) {
      const newval = [];
      let isCircuitValue256: boolean | null = null;
      for (let nestedKey of val) {
        if (String(nestedKey).length == 66) {
          if (isCircuitValue256 === false) throw new Error("All array elements must be of the same type")
          isCircuitValue256 = true;
          newval.push(getCircuitValue256Witness(nestedKey));
        }
        else {
          if (isCircuitValue256 === true) throw new Error("All array elements must be of the same type")
          isCircuitValue256 = false;
          newval.push(getCircuitValueWitness(nestedKey));
        }
      }
      parsedInputs[key] = newval;
    }
    else if (String(val).length == 66) {
      parsedInputs[key] = getCircuitValue256Witness(val);
    }
    else {
      parsedInputs[key] = getCircuitValueWitness(val);
    }
  }

  return parsedInputs;
}

const padInstances = () => {
  const halo2Lib = globalThis.axiom.halo2lib;
  const halo2Wasm = globalThis.axiom.halo2wasm;
  let userInstances = [...halo2Wasm.getInstances(0)];
  const numUserInstances = userInstances.length;

  const dataInstances = [...halo2Wasm.getInstances(1)];
  const numDataInstances = dataInstances.length;

  for (let i = numUserInstances; i < USER_COMPUTE_NUM_INSTANCES; i++) {
    let witness = halo2Lib.witness("0");
    userInstances.push(witness);
  }

  for (let i = numDataInstances; i < SUBQUERY_NUM_INSTANCES; i++) {
    let witness = halo2Lib.witness("0");
    dataInstances.push(witness);
  }

  halo2Wasm.setInstances(new Uint32Array(userInstances), 0);
  halo2Wasm.setInstances(new Uint32Array(dataInstances), 1);
  return { numUserInstances };
}

export function AxiomCircuitRunner(halo2Wasm: Halo2Wasm, halo2LibWasm: Halo2LibWasm, config: CircuitConfig, provider: JsonRpcProvider) {
  globalThis.axiom.halo2wasm = halo2Wasm;
  globalThis.axiom.halo2lib = halo2LibWasm;
  globalThis.axiom.provider = provider;
  globalThis.axiom.dataQuery = [];

  config = { ...config };
  const clear = () => {
    halo2Wasm.clear();
    halo2LibWasm.config();
  }

  async function runFromString(code: string, inputs: string, { results, firstPass }: { results: { [key: string]: string }, firstPass?: boolean }) {
    clear()
    if (firstPass == undefined) firstPass = true;

    const halo2Lib = await import("@axiom-crypto/halo2-lib-js/halo2lib/functions");
    const halo2LibFns = Object.keys(halo2Lib).filter(key => !(typeof key === 'string' && (key.charAt(0) === '_' || key === "makePublic")));

    const axiomData = await import("./functions")
    const axiomDataFns = Object.keys(axiomData).filter(key => !(typeof key === 'string' && key.charAt(0) === '_'));

    let functionInputs = getInputFunctionSignature(inputs);
    let parsedInputs = parseDataInputs(inputs);

    let fn = eval(`let {${halo2LibFns.join(", ")}} = halo2Lib; let {${axiomDataFns.join(", ")}} = axiomData; (async function({${functionInputs}}) { ${code} })`);
    await fn(parsedInputs);

    const { numUserInstances } = padInstances();
    halo2Wasm.assignInstances();

    let newConfig = config;

    if (firstPass) {
      autoConfigCircuit(config);
      const { config: _newConfig } = await runFromString(code, inputs, { results, firstPass: false });
      newConfig = _newConfig;
    }

    return {
      config: newConfig,
      numUserInstances
    }
  }

  async function run<T extends { [key: string]: number | string | bigint }>(f: (inputs: T) => Promise<void>, inputs: T, results: { [key: string]: string }) {
    clear()

    let stringifiedInputs = JSON.stringify(inputs);
    let parsedInputs = parseDataInputs(stringifiedInputs);

    await f(parsedInputs);

    const { numUserInstances } = padInstances();
    halo2Wasm.assignInstances();
    return {
      numUserInstances
    };
  }

  return Object.freeze({
    runFromString,
    run
  })
}
