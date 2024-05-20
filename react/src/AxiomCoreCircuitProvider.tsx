import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Remote, wrap } from "comlink";
import { 
  AxiomV2CompiledCircuit,
  AxiomV2Callback,
  AxiomV2SendQueryArgs,
  AxiomV2QueryOptions,
} from "@axiom-crypto/client/types/";
import {
  AxiomCore,
  AxiomBaseCircuitGeneric,
} from "@axiom-crypto/client/axiom/axiomCore";

export type AxiomCircuitContextType<T> = {
  setParams: (inputs: T, callbackTarget: string, callbackExtraData: string, caller: string) => void,
  areParamsSet: boolean,
  build: () => Promise<AxiomV2SendQueryArgs | null>,
  builtQuery: AxiomV2SendQueryArgs | null,
  reset: () => void,
}

type CoreState<T> = {
  setWorkerApi: React.Dispatch<React.SetStateAction<React.MutableRefObject<Remote<AxiomCore<T, AxiomBaseCircuitGeneric<T>>>> | undefined>>,
  inputs: any,
  options: AxiomV2QueryOptions | null,
  callback: AxiomV2Callback | null,
  caller: string | null,
  builtQuery: AxiomV2SendQueryArgs | null,
}

type AxiomCoreCircuitContextType<T> = CoreState<T> & AxiomCircuitContextType<T>;

type GenericAxiomWorker<T> = {
  init: () => Promise<void>,
  prove: (inputs: T) => Promise<AxiomV2SendQueryArgs>,
}

export const AxiomCoreCircuitContext = createContext<AxiomCoreCircuitContextType<any> | null>(null);

export const useAxiomCoreCircuit = <T,>(): AxiomCoreCircuitContextType<T> => {
  const context = useContext(AxiomCoreCircuitContext);
  if (context === null) {
    throw new Error("useAxiomCoreCircuit must be used within AxiomCoreCircuitProvider");
  }
  return context;
}

export const AxiomCoreCircuitProvider = <T,>({
  children,
}: {
  children: React.ReactNode,
}) => {
  const [workerApi, setWorkerApi] = useState<React.MutableRefObject<Remote<AxiomCore<T, AxiomBaseCircuitGeneric<T>>>> | undefined>(undefined);
  const [inputs, setInputs] = useState<any | null>(null);
  const [options, setOptions] = useState<AxiomV2QueryOptions | null>(null);
  const [callback, setCallback] = useState<AxiomV2Callback | null>(null);
  const [caller, setCaller] = useState<string | null>(null);
  const [builtQuery, setBuiltQuery] = useState<AxiomV2SendQueryArgs | null>(null);

  const build = async () => {
    if (!workerApi) {
      return null;
    }
    if (!inputs || !callback || !caller) {
      console.warn("`inputs` or `callback` or `caller` not set");
      return null;
    }
    if (builtQuery !== null) {
      return null;
    }

    const setup = async () => {
      if (!workerApi.current) {
        console.warn("Worker API not set up");
        return null;
      }
      await workerApi.current.init();
    }

    const generateQuery = async () => {
      if (!workerApi.current) {
        console.warn("Worker API not set up");
        return null;
      }
      const sendQueryArgs = await workerApi.current.prove(inputs);
      setBuiltQuery(sendQueryArgs);
      return sendQueryArgs;
    }
    await setup();
    return await generateQuery();
  }

  const reset = () => {
    setBuiltQuery(null);
  }

  const setParams = useCallback((inputs: any, callbackTarget: string, callbackExtraData: string, caller: string, options?: AxiomV2QueryOptions) => {
    console.log("YJLOG setParams");
    if (callbackExtraData === "") {
      callbackExtraData = "0x";
    }
    setInputs(inputs);
    setCallback({
      target: callbackTarget,
      extraData: callbackExtraData,
    });
    setCaller(caller);
    setOptions(options ?? {});
  }, []);

  const areParamsSet = (inputs !== null && callback !== null);

  const contextValues: AxiomCoreCircuitContextType<T> = {
    setParams,
    areParamsSet,
    build,
    builtQuery,
    reset,
    inputs,
    options,
    callback,
    caller,
    setWorkerApi,
  };

  console.log("YJLOG AxiomCoreCircuitProvider contextValues", contextValues);

  return (
    <AxiomCoreCircuitContext.Provider value={contextValues}>
      {children}
    </AxiomCoreCircuitContext.Provider>
  )
}
