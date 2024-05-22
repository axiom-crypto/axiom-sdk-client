import { 
  AxiomV2CompiledCircuit,
  BridgeType,
  ChainConfig,
  TargetChainConfig,
} from "@axiom-crypto/client/types/";
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
  target: TargetChainConfig,
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

  if (bridgeType === BridgeType.Broadcaster && bridgeId === undefined) {
    throw new Error("`bridgeId` is required for Broadcaster bridge type");
  }

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
            caller: caller ?? "", // must be filled in via setParams
          },
          bridgeType,
          bridgeId,
          compiledCircuit,
          callback: callback ?? { target: "", extraData: "" }, // must be filled in via setParams
          options: options ?? {}, // can be filled in via setParams
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
  target: TargetChainConfig,
  bridgeType: BridgeType,
  bridgeId?: number,
  children: React.ReactNode,
}) => {
  return (
    <AxiomCoreCircuitProvider>
      <AxiomCrosschainIntermediateCircuitProvider
        source={source}
        target={target}
        bridgeType={bridgeType}
        bridgeId={bridgeId}
        compiledCircuit={compiledCircuit}
      >
        {children}
      </AxiomCrosschainIntermediateCircuitProvider>
    </AxiomCoreCircuitProvider>
  )
}
