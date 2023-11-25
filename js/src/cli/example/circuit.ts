//@ts-ignore -- to avoid halo2-lib-js being a dependency of the cli
import { getHeader, CircuitValue, addToCallback, add, sub, mul, constant, witness, log, rangeCheck, isLessThan } from "@axiom-crypto/client-rc";

export const circuit = async (inputs: {x: CircuitValue}) => {
    const a = witness(1);
    const b = witness(2);
    const c = witness(3);
    const d = add(a, b);
    const e = sub(c, b);
    const f = mul(d, e);
    const g = add(f, inputs.x);
    log(g)
    const w = add(g, 10)
    log(w)
    const ww = mul(w, 5)
    log(ww)
    log(g);
    rangeCheck(50, 8)
    rangeCheck(50, 8)
    isLessThan(1, 9, "4")
    const header = getHeader(9000000);
    let result = await header.gasLimit();
    addToCallback(result)
    log(result);
}

export const inputs = {
    x: 9,
}