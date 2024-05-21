import { 
  AxiomV2CompiledCircuit,
  BridgeType,
  ChainConfig,
  ClientConfig,
} from "@axiom-crypto/client";
import {
  AxiomCoreCircuitProvider,
  AxiomCircuitContextType,
  useAxiomCoreCircuit,
} from "./AxiomCoreCircuitProvider";
import { AxiomCrosschainWorker } from "./workers/axiomCrosschainWorker";
import { Remote, wrap } from "comlink";
import React, { createContext, useContext, useEffect, useRef } from "react";

const AxiomCrosschainCircuitContext = createContext<AxiomCircuitContextType<any> | null>(null);

export const useAxiomCrosschainCircuit = <T,>(): AxiomCircuitContextType<T> => {
  const context = useContext(AxiomCrosschainCircuitContext);
  if (context === null) {
    throw new Error("useAxiomCrosschainCircuit must be used within AxiomCrosschainCircuitProvider");
  }
  return context;
}

const AxiomCrosschainIntermediateCircuitProvider = <T,>({
  compiledCircuit,
  source,
  target,
  bridgeType,
  bridgeId,
  children,
}: {
  compiledCircuit: AxiomV2CompiledCircuit,
  source: ChainConfig,
  target: ClientConfig,
  bridgeType: BridgeType,
  bridgeId?: number,
  children: React.ReactNode,
}) => {
  const {
    setParams,
    areParamsSet,
    build,
    builtQuery,
    reset,
    callback,
    caller,
    options,
    setWorkerApi,
  } = useAxiomCoreCircuit();

  const workerApi = useRef<Remote<AxiomCrosschainWorker<T>>>();

  useEffect(() => {
    let isMounted = true; 

    const setupWorker = async () => {
      if (!callback || !caller) {
        return;
      }
      const worker = new Worker(new URL("./workers/axiomCrosschainWorker", import.meta.url), { type: "module" });
      const WrappedAxiomCrosschainWorker = wrap<typeof AxiomCrosschainWorker>(worker);
      workerApi.current = await new WrappedAxiomCrosschainWorker(
        {
          source,
          target: {
            ...target,
            caller: caller ?? "",
          },
          bridgeType,
          bridgeId,
          compiledCircuit,
          callback: callback ?? { target: "", extraData: "" },
          options: options ?? {},
        },
        window.navigator.hardwareConcurrency,
      );
      if (isMounted && workerApi.current) {
        setWorkerApi(workerApi as any);
      }
    };

    setupWorker();

    return () => {
      isMounted = false;
    };
  }, [source, target, bridgeType, bridgeId, compiledCircuit, callback, caller, options]);

  const contextValues = {
    setParams,
    areParamsSet,
    build,
    builtQuery,
    reset,
  }

  return (
    <AxiomCrosschainCircuitContext.Provider value={contextValues}>
      {children}
    </AxiomCrosschainCircuitContext.Provider>
  )
}

 export const AxiomCrosschainCircuitProvider = ({
  compiledCircuit,
  source,
  target,
  bridgeType,
  bridgeId,
  children,
}: {
  compiledCircuit: AxiomV2CompiledCircuit,
  source: ChainConfig,
  target: ClientConfig,
  bridgeType: BridgeType,
  bridgeId?: number,
  children: React.ReactNode,
}) => {
  return (
    <AxiomCoreCircuitProvider>
      <AxiomCrosschainIntermediateCircuitProvider source={source} target={target} bridgeType={bridgeType} bridgeId={bridgeId} compiledCircuit={compiledCircuit}>
        {children}
      </AxiomCrosschainIntermediateCircuitProvider>
    </AxiomCoreCircuitProvider>
  )
}