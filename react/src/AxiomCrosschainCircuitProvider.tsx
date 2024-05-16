import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Remote, wrap } from "comlink";
import { AxiomCircuit } from "./worker";
import { 
  AxiomV2CompiledCircuit,
  AxiomV2Callback,
  AxiomV2SendQueryArgs,
  AxiomV2QueryOptions,
  buildSendQuery,
  BridgeType,
  DEFAULT_CAPACITY,
  getAxiomV2QueryAddress,
  SourceChainConfig,
  TargetChainConfig,
} from "@axiom-crypto/client";

export { useAxiomCircuit } from "./AxiomCoreCircuitProvider";

export const AxiomCrosschainCircuitProvider = ({
  compiledCircuit,
  source,
  target,
  children,
}: {
  compiledCircuit: AxiomV2CompiledCircuit;
  source: SourceChainConfig;
  target: TargetChainConfig;
  children: React.ReactNode;
}) => {
  
};