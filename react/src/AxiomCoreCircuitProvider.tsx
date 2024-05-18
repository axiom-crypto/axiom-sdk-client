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

type AxiomCircuitContextType<T> = {
  setParams: (inputs: T, callbackTarget: string, callbackExtraData: string, caller: string) => void,
  areParamsSet: boolean,
  build: () => Promise<AxiomV2SendQueryArgs | null>,
  builtQuery: AxiomV2SendQueryArgs | null,
  reset: () => void,
}

type GenericAxiomWorker<T> = {
  init: () => Promise<void>,
  prove: (inputs: T) => Promise<AxiomV2SendQueryArgs>,
}

export const AxiomCircuitContext = createContext<AxiomCircuitContextType<any> | null>(null);

export const useAxiomCircuit = <T,>(): AxiomCircuitContextType<T> => {
  const context = useContext(AxiomCircuitContext);
  if (context === null) {
    throw new Error("useAxiomCircuit must be used within AxiomCircuitProvider");
  }
  return context;
}

export const AxiomCoreCircuitProvider = <T,>({
  workerApi,
  children,
}: {
  workerApi: React.MutableRefObject<Remote<GenericAxiomWorker<T>>>,
  children: React.ReactNode,
}) => {
  const [inputs, setInputs] = useState<any | null>(null);
  const [options, setOptions] = useState<AxiomV2QueryOptions | null>(null);
  const [callback, setCallback] = useState<AxiomV2Callback | null>(null);
  const [caller, setCaller] = useState<string | null>(null);
  const [builtQuery, setBuiltQuery] = useState<AxiomV2SendQueryArgs | null>(null);

  const build = async () => {
    if (!inputs || !callback || !caller) {
      console.warn("`inputs` or `callback` or `caller` not set");
      return null;
    }
    if (builtQuery !== null) {
      return null;
    }

    const setup = async () => {
      await workerApi.current.init();
    }

    const generateQuery = async () => {
      if (!workerApi.current) {
        console.warn("Worker API not set up");
        return null;
      }
      const worker = workerApi.current!;
      const sendQueryArgs = await worker.prove(inputs);
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

  const contextValues = {
    setParams,
    areParamsSet,
    build,
    builtQuery,
    reset,
  };

  return (
    <AxiomCircuitContext.Provider value={contextValues}>
      {children}
    </AxiomCircuitContext.Provider>
  )
}
