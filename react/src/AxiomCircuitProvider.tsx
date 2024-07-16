import { 
  AxiomV2CompiledCircuit,
} from "@axiom-crypto/client/types/";
import {
  AxiomCoreCircuitProvider,
  AxiomCircuitContextType,
  useAxiomCoreCircuit,
} from "./AxiomCoreCircuitProvider";
import { AxiomWorker } from "./workers/axiomWorker";
import { Remote, wrap } from "comlink";
import React, { createContext, useContext, useEffect, useRef } from "react";

const AxiomCircuitContext = createContext<AxiomCircuitContextType<any> | null>(null);

export const useAxiomCircuit = <T,>(): AxiomCircuitContextType<T> => {
  const context = useContext(AxiomCircuitContext);
  if (context === null) {
    throw new Error("useAxiomCircuit must be used within AxiomCircuitProvider");
  }
  return context;
}

const AxiomIntermediateCircuitProvider = <T,>({
  compiledCircuit,
  chainId,
  rpcUrl,
  children,
}: {
  chainId: number | string | bigint,
  rpcUrl: string,
  compiledCircuit: AxiomV2CompiledCircuit,
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

  const workerApi = useRef<Remote<AxiomWorker<T>>>();

  useEffect(() => {
    let isMounted = true; 

    const setupWorker = async () => {
      if (!callback || !caller) {
        return;
      }
      const worker = new Worker(new URL("./workers/axiomWorker", import.meta.url), { type: "module" });
      const WrappedAxiomWorker = wrap<typeof AxiomWorker>(worker);
      workerApi.current = await new WrappedAxiomWorker(
        {
          chainId: chainId.toString(),
          rpcUrl,
          compiledCircuit,
          callback: callback ?? { target: "", extraData: "" }, // must be filled in via setParams
          caller: caller ?? "", // must be filled in via setParams
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
  }, [chainId, rpcUrl, compiledCircuit, callback, caller, options]);

  const contextValues = {
    setParams,
    areParamsSet,
    build,
    builtQuery,
    reset,
  }

  return (
    <AxiomCircuitContext.Provider value={contextValues}>
      {children}
    </AxiomCircuitContext.Provider>
  )
}

 export const AxiomCircuitProvider = ({
  compiledCircuit,
  chainId,
  rpcUrl,
  children,
}: {
  chainId: number | string | bigint,
  rpcUrl: string,
  compiledCircuit: AxiomV2CompiledCircuit,
  children: React.ReactNode,
}) => {
  return (
    <AxiomCoreCircuitProvider>
      <AxiomIntermediateCircuitProvider
        chainId={chainId}
        rpcUrl={rpcUrl}
        compiledCircuit={compiledCircuit}
      >
        {children}
      </AxiomIntermediateCircuitProvider>
    </AxiomCoreCircuitProvider>
  )
}
