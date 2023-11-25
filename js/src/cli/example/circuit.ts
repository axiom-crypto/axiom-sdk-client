import {add, sub, mul, constant, witness, log, rangeCheck, makePublic, isLessThan} from "@axiom-crypto/halo2-lib-js";
//@ts-ignore -- to avoid halo2-lib-js being a dependency of the cli
import { getHeader, CircuitValue } from "@axiom-crypto/client-rc";

export const circuit = async (inputs: {x: CircuitValue}) => {
    const a = witness(1);
    const b = witness(2);
    const c = witness(3);
    const d = add(a, b);
    const e = sub(c, b);
    const f = mul(d, e);
    const g = add(f, inputs.x);
    log(g);
    rangeCheck(witness(50), 8)
    rangeCheck(witness(50), 8)
    isLessThan(constant(1), constant(9), "4")
    makePublic(g);
    makePublic(constant(1));
    const header = getHeader(9000000);
    let result = await header.gasLimit();
    log(result);
}

export const inputs = {
    x: 9,
}