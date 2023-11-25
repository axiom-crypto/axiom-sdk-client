import { CircuitValue, convertInput, RawCircuitInput, CircuitValue256 } from "@axiom-crypto/halo2-lib-js";

export const getCircuitValue256Witness = (value: RawCircuitInput) => {
  let convertedVal = BigInt(value).toString(16).padStart(64, '0');
  let hi128 = convertedVal.slice(0, 32);
  let lo128 = convertedVal.slice(32);

  const hi128CircuitValue = new CircuitValue({ cell: globalThis.axiom.halo2lib.witness(convertInput("0x" + hi128)) });
  const lo128CircuitValue = new CircuitValue({ cell: globalThis.axiom.halo2lib.witness(convertInput("0x" + lo128)) });
  const halo2LibValue256 = new CircuitValue256({ hi: hi128CircuitValue, lo: lo128CircuitValue });
  return halo2LibValue256;
}

export const getCircuitValueWitness = (value: RawCircuitInput) => {
  const halo2LibValue = new CircuitValue({ cell: globalThis.axiom.halo2lib.witness(convertInput(value)) });
  return halo2LibValue;
}

export const getCircuitValue256Constant = (value: RawCircuitInput) => {
  let convertedVal = BigInt(value).toString(16).padStart(64, '0');
  let hi128 = convertedVal.slice(0, 32);
  let lo128 = convertedVal.slice(32);

  const hi128CircuitValue = new CircuitValue({ cell: globalThis.axiom.halo2lib.constant(convertInput("0x" + hi128)) });
  const lo128CircuitValue = new CircuitValue({ cell: globalThis.axiom.halo2lib.constant(convertInput("0x" + lo128)) });
  const halo2LibValue256 = new CircuitValue256({ hi: hi128CircuitValue, lo: lo128CircuitValue });
  return halo2LibValue256;
}

export const getCircuitValueConstant = (value: RawCircuitInput) => {
  const halo2LibValue = new CircuitValue({ cell: globalThis.axiom.halo2lib.constant(convertInput(value)) });
  return halo2LibValue;
}

export const getCircuitValueWithOffset = (value: CircuitValue, offset: RawCircuitInput) => {
  const cell = globalThis.axiom.halo2lib.add(value.cell(), globalThis.axiom.halo2lib.constant(Number(offset).toString()))
  const halo2LibValue = new CircuitValue({ cell });
  return halo2LibValue;
}

export const isRawCircuitInput = (input: RawCircuitInput | CircuitValue | CircuitValue256) => {
  return typeof input === "string" || typeof input === "number" || typeof input === "bigint";
}

export const getCircuitValue256FromCircuitValue = (value: CircuitValue) => {
  const [hi, lo] = globalThis.axiom.halo2lib.to_hi_lo(value.cell());
  const hi128CircuitValue = new CircuitValue({ cell: hi });
  const lo128CircuitValue = new CircuitValue({ cell: lo });
  const halo2LibValue256 = new CircuitValue256({ hi: hi128CircuitValue, lo: lo128CircuitValue });
  return halo2LibValue256;
}

export const lowercase = (str: string) => {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

export const convertToBytes32 = (inputArray: Uint8Array) => {
  let result: string[] = [];
  for (let i = 0; i < inputArray.length; i += 32) {
    let slice = inputArray.slice(i, i + 32);
    let hex = Buffer.from(slice).toString('hex').padStart(64, '0');
    result.push(hex);
  }
  return result;
}

export const convertToBytes = (inputArray: Uint8Array): string => {
  let hex = Buffer.from(inputArray).toString('hex');
  return hex;
}

export const getRandom32Bytes = (): `0x${string}` => {
  let randomBytes = "";

  for (let i = 0; i < 64; i++) { // Each byte has two hex characters
    const randomHex = Math.floor(Math.random() * 16).toString(16);
    randomBytes += randomHex;
  }

  return `0x${randomBytes}`;
}
