import { CircuitValue, add, addToCallback, constant, mul } from "@axiom-crypto/circuit";

export interface CircuitInputs {
  x: CircuitValue[];
  y: CircuitValue[];
}

export const defaultInputs = {
  x: [10,5,20,15,8,9,2,8,1,5,1,2,5,1,95,3,2,60,9,11],
  y: [8,2,5,6,2,18,2,20,5,2,29,5,5,2,8,22,3,5,2,40]
};

export const circuit = async (inputs: CircuitInputs) => {
  let xRes: CircuitValue[] = [];
    for (let i = 0; i < inputs.x.length; i++) {
        // x^2 + y
        const x_2 = mul(inputs.x[i], inputs.x[i]);
        const val = add(x_2, inputs.y[i]);
        xRes.push(val);
    }

    let yRes: CircuitValue[] = [];
    for (let i = 0; i < inputs.y.length; i++) {
        // x^2 + y
        const y_2 = mul(inputs.y[i], inputs.y[i]);
        const val = add(y_2, inputs.x[i]);
        yRes.push(val);
    }

    let zRes: CircuitValue[] = [];
    for (let i = 0; i < xRes.length; i++) {
        const val = mul(xRes[i], yRes[i]);
        zRes.push(val);
    }

    let aRes: CircuitValue[] = [];
    for (let i = 0; i < xRes.length; i++) {
        for (let j = 0; j < yRes.length; j++) {
            const val = mul(xRes[i], yRes[j]);
            aRes.push(val);
        }
    }

    let bRes: CircuitValue[] = [];
    for (let i = 0; i < yRes.length; i++) {
        for (let j = 0; j < zRes.length; j++) {
            const val = mul(yRes[i], zRes[j]);
            bRes.push(val);
        }
    }

    let cRes: CircuitValue[] = [];
    for (let i = 0; i < zRes.length; i++) {
        for (let j = 0; j < xRes.length; j++) {
            const val = mul(zRes[i], xRes[j]);
            cRes.push(val);
        }
    }

    for (let i = 0; i < xRes.length; i++) {
        addToCallback(xRes[i]);
        addToCallback(yRes[i]);
        addToCallback(zRes[i]);
    }

    for (let i = 0; i < aRes.length; i++) {
        const val = mul(cRes[i], mul(aRes[i], bRes[i]));
        addToCallback(val);
    }
}