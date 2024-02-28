import { concat, encodePacked, pad } from "viem";
import { resizeArray } from "../utils";
import { AxiomV2CircuitMetadataParams } from "../types";

export const encodeAxiomV2CircuitMetadata = (params: AxiomV2CircuitMetadataParams): string => {
  // JS client overrides
  params.numChallenge = [0];
  params.isAggregation = false;

  const encodedVersion = encodePacked(
    ["uint8"],
    [params.version]
  );
  let encoded = concat([encodedVersion]);

  const encodedNumValuesPerInstanceColumnLen = encodePacked(
    ["uint8"],
    [params.numValuesPerInstanceColumn.length]
  );
  const encodedNumValuesPerInstanceColumn = params.numValuesPerInstanceColumn.map((values) => encodePacked(
    ["uint32"],
    [values]
  ));
  encoded = concat([encoded, encodedNumValuesPerInstanceColumnLen, ...encodedNumValuesPerInstanceColumn]);

  const numPhase = params.numChallenge.length;
  if (numPhase === 0) {
    throw new Error("numChallenge must be non-empty")
  }
  const encodedNumPhase = encodePacked(
    ["uint8"],
    [numPhase]
  )
  const encodedNumChallenge = params.numChallenge.map((numChallenge) => encodePacked(
    ["uint8"],
    [numChallenge]
  ));
  encoded = concat([encoded, encodedNumPhase, ...encodedNumChallenge]);

  const encodedIsAggregation = encodePacked(
    ["bool"],
    [params.isAggregation]
  );
  encoded = concat([encoded, encodedIsAggregation]);

  if (params.numAdvicePerPhase.length > numPhase) {
    throw new Error("numAdvicePerPhase must be <= numPhase (numChallenge.length)");
  }
  let numAdviceCols = params.numAdvicePerPhase;
  const resizedNumAdviceCols = resizeArray<number>(numAdviceCols, numPhase, 0);
  const encodedNumAdviceCols = resizedNumAdviceCols.map((adviceCols) => encodePacked(
    ["uint16"],
    [adviceCols]
  ));
  encoded = concat([encoded, ...encodedNumAdviceCols]);

  if (params.numLookupAdvicePerPhase.length > numPhase) {
    throw new Error("numLookupAdvicePerPhase must be <= numPhase (numChallenge.length)");
  }
  let numLookupAdviceCols = params.numLookupAdvicePerPhase;
  const resizedNumLookupAdviceCols = resizeArray<number>(numLookupAdviceCols, numPhase, 0);
  const encodedNumLookupAdviceCols = resizedNumLookupAdviceCols.map((lookupAdviceCols) => encodePacked(
    ["uint8"],
    [lookupAdviceCols]
  ));
  encoded = concat([encoded, ...encodedNumLookupAdviceCols]);

  const encodedNumRlcColumns = encodePacked(
    ["uint16"],
    [params.numRlcColumns]
  );
  const encodedNumFixed = encodePacked(
    ["uint8"],
    [params.numFixed]
  );
  const encodedMaxOutputs = encodePacked(
    ["uint16"],
    [params.maxOutputs]
  );
  encoded = concat([encoded, encodedNumRlcColumns, encodedNumFixed, encodedMaxOutputs]);

  if (encoded.slice(2).length > 64) {
    throw new Error(`Circuit metadata cannot be packed into bytes32 (byte length=${encoded.slice(2).length/2})`);
  }
  encoded = pad(encoded, {size: 32, dir: "right"});

  return encoded;
}
