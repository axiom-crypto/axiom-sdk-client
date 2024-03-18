import { concat, zeroHash } from "viem";
import { AxiomBaseCircuit } from "../../../src/js";
import { circuit as seven_balance_override_circuit } from "../circuits/7_balance_override.circuit";

describe("Scaffold with limit overrides", () => {
    test("Build computeQuery with limit overrides", async () => {
        // This circuit gets a single account's balance 7 times and adds them to the results
        const testCircuit = new AxiomBaseCircuit({
            provider: process.env.PROVIDER_URI_SEPOLIA as string,
            f: seven_balance_override_circuit,
            inputSchema: `{
          "address": "CircuitValue",
          "claimedBlockNumber": "CircuitValue"
        }`,
            chainId: 5,
            mock: true,
            capacity: {
                maxOutputs: 200,
                maxSubqueries: 200,
            }
        });
        const defaultInputs = {
            address: "0x897dDbe14c9C7736EbfDC58461355697FbF70048",
            claimedBlockNumber: 5000000,
        };
        const _artifact = await testCircuit.compile(defaultInputs);
        const computeQuery = await testCircuit.run(defaultInputs);
        const querySchema = testCircuit.getQuerySchema();

        expect(querySchema).toEqual("0xf5df33bfd48dbc018103b67351c058344231d5707ff500f360c728f62cd44b52");
        expect(computeQuery.vkey[0]).toEqual("0x000100000e1001000000040100000100c8000000000000000000000000000000");
        expect(computeQuery.computeProof.slice(2).slice(0, 128)).toEqual(concat([zeroHash, zeroHash]).slice(2));
    }, 60000);
});