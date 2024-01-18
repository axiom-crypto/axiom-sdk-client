import { JsonRpcProvider } from "ethers";
import { getCircuitValue256Witness, getCircuitValueWitness } from "./utils";
import { SUBQUERY_NUM_INSTANCES, USER_COMPUTE_NUM_INSTANCES } from "./constants";
import { getInputFunctionSignature } from "@axiom-crypto/halo2-lib-js/shared/utils";
import { autoConfigCircuit, CircuitConfig, setCircuit } from "@axiom-crypto/halo2-lib-js";
import { Halo2Wasm, Halo2LibWasm } from "@axiom-crypto/halo2-lib-js/wasm/web";
import { RawInput } from "./types";

const autoParseDataInputs = (inputs: string) => {
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

const parseDataInputsFromSchema = (inputs: string, inputSchema: string) => {
  let parsedInputs = JSON.parse(inputs);
  let parsedInputKeys = Object.keys(parsedInputs);
  let parsedSchema = JSON.parse(inputSchema);
  for (let key of parsedInputKeys) {
    const type = parsedSchema[key];
    const val = parsedInputs[key];
    if (type === "CircuitValue") {
      parsedInputs[key] = getCircuitValueWitness(val);
    }
    else if (type === "CircuitValue256") {
      parsedInputs[key] = getCircuitValue256Witness(val);
    }
    else if (type === "CircuitValue[]") {
      const newval = [];
      for (let nestedKey of val) {
        newval.push(getCircuitValueWitness(nestedKey));
      }
      parsedInputs[key] = newval;
    }
    else if (type === "CircuitValue256[]") {
      const newval = [];
      for (let nestedKey of val) {
        newval.push(getCircuitValue256Witness(nestedKey));
      }
      parsedInputs[key] = newval;
    }
    else {
      throw new Error(`Invalid type ${type}`);
    }
  }
  return parsedInputs;
}

const parseDataInputs = (inputs: string, inputSchema?: string) => {
  if (inputSchema !== undefined) {
    return parseDataInputsFromSchema(inputs, inputSchema);
  }
  else {
    return autoParseDataInputs(inputs);

  }
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

export function AxiomCircuitRunner(halo2Wasm: Halo2Wasm, halo2LibWasm: Halo2LibWasm, config: CircuitConfig, provider: string) {
  globalThis.axiom = {
    dataQuery: [],
    halo2lib: halo2LibWasm,
    halo2wasm: halo2Wasm,
    provider: new JsonRpcProvider(provider),
    results: {}
  };
  setCircuit(halo2Wasm, halo2LibWasm);

  config = { ...config };
  const clear = () => {
    halo2Wasm.clear();
    halo2LibWasm.config();
    globalThis.axiom.dataQuery = [];
  }

  async function runFromString(code: string, inputs: string, inputSchema: string | undefined, { results, firstPass }: { results: { [key: string]: string }, firstPass?: boolean }) {
    clear()
    if (firstPass == undefined) firstPass = true;
    globalThis.axiom.results = results;

    const halo2Lib = await import("@axiom-crypto/halo2-lib-js/halo2lib/functions");
    const halo2LibFns = Object.keys(halo2Lib).filter(key => !(typeof key === 'string' && (key.charAt(0) === '_' || key === "makePublic")));

    const axiomData = await import("./subquery")
    const axiomDataFns = Object.keys(axiomData).filter(key => !(typeof key === 'string' && key.charAt(0) === '_'));

    let functionInputs = getInputFunctionSignature(inputs);
    let parsedInputs = parseDataInputs(inputs);

    let fn = eval(`let {${halo2LibFns.join(", ")}} = halo2Lib; let {${axiomDataFns.join(", ")}} = axiomData; (async function(input) { ${code} })`);
    await fn(parsedInputs);

    const { numUserInstances } = padInstances();
    halo2Wasm.assignInstances();

    let newConfig = config;

    if (firstPass) {
      autoConfigCircuit(config);
      const { config: _newConfig } = await runFromString(code, inputs, inputSchema, { results, firstPass: false });
      newConfig = _newConfig;
    }

    return {
      config: newConfig,
      numUserInstances,
      results: globalThis.axiom.results,
      dataQuery: globalThis.axiom.dataQuery
    }
  }

  async function run<T>(f: (inputs: T) => Promise<void>, inputs: RawInput<T>, inputSchema: string | undefined, results?: { [key: string]: string }) {
    clear()
    globalThis.axiom.results = results ?? {};

    let stringifiedInputs = JSON.stringify(inputs);
    let parsedInputs = parseDataInputs(stringifiedInputs, inputSchema);

    await f(parsedInputs);

    const { numUserInstances } = padInstances();
    halo2Wasm.assignInstances();

    return {
      numUserInstances,
      results: globalThis.axiom.results,
      dataQuery: globalThis.axiom.dataQuery
    };
  }

  async function compile<T>(f: (inputs: T) => Promise<void>, inputs: RawInput<T>, inputSchema: string | undefined, results?: { [key: string]: string }) {
    setCircuit(halo2Wasm, halo2LibWasm, true);
    const res = await run(f, inputs, inputSchema, results);
    autoConfigCircuit(config);
    return {
      config,
      ...res
    }
  }

  return Object.freeze({
    runFromString,
    run,
    compile
  })
}
