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
import { AxiomWorker } from "./workers/axiom";

type AxiomCircuitContextType<T> = {
  setParams: (inputs: T, callbackTarget: string, callbackExtraData: string, caller: string) => void,
  areParamsSet: boolean,
  build: () => Promise<AxiomV2SendQueryArgs | null>,
  builtQuery: AxiomV2SendQueryArgs | null,
  reset: () => void,
}

export const AxiomCircuitContext = createContext<AxiomCircuitContextType<any> | null>(null);

export const useAxiomCircuit = <T,>(): AxiomCircuitContextType<T> => {
  const context = useContext(AxiomCircuitContext);
  if (context === null) {
    throw new Error("useAxiomCircuit must be used within a AxiomCircuitProvider");
  }
  return context;
}

export const AxiomCoreCircuitProvider = ({
  compiledCircuit,
  chainId,
  rpcUrl,
  children,
}: {
  compiledCircuit: AxiomV2CompiledCircuit,
  chainId: number | string | bigint,
  rpcUrl: string,
  children: React.ReactNode,
}) => {
  const [inputs, setInputs] = useState<any | null>(null);
  const [options, setOptions] = useState<AxiomV2QueryOptions | null>(null);
  const [callback, setCallback] = useState<AxiomV2Callback | null>(null);
  const [caller, setCaller] = useState<string | null>(null);
  const [builtQuery, setBuiltQuery] = useState<AxiomV2SendQueryArgs | null>(null);

  const workerApi = useRef<Remote<AxiomWorker<typeof inputs>>>();

  const build = async () => {
    if (!inputs || !callback || !caller) {
      console.warn("`inputs` or `callback` or `caller` not set");
      return null;
    }
    if (builtQuery !== null) {
      return null;
    }

    const setup = async () => {
      const worker = new Worker(new URL("./workers/axiom", import.meta.url), { type: "module" });
      const WrappedAxiomWorker = wrap<typeof AxiomWorker>(worker);
      workerApi.current = await new WrappedAxiomWorker(
        {
          chainId: chainId.toString(),
          rpcUrl,
          compiledCircuit,
          callback,
          caller,
          options: options ?? {},
        },
        window.navigator.hardwareConcurrency,
      );
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
