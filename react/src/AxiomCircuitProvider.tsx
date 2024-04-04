import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Remote, wrap } from "comlink";
import { AxiomV2CompiledCircuit, AxiomV2Callback, AxiomV2SendQueryArgs, AxiomV2ClientOptions, DEFAULT_CAPACITY } from "@axiom-crypto/client";
import { AxiomCircuit } from "./worker";

type AxiomCircuitContextType<T> = {
  setOptions: React.Dispatch<React.SetStateAction<AxiomV2ClientOptions | null>>,
  setParams: (inputs: T, callbackTarget: string, callbackExtraData: string, refundee: string) => void,
  areParamsSet: boolean,
  build: () => Promise<AxiomV2SendQueryArgs | null>,
  builtQuery: AxiomV2SendQueryArgs | null,
  reset: () => void,
}

const AxiomCircuitContext = createContext<AxiomCircuitContextType<any> | null>(null);

const useAxiomCircuit = <T,>(): AxiomCircuitContextType<T> => {
  const context = useContext(AxiomCircuitContext);
  if (context === null) {
    throw new Error("useAxiomCircuit must be used within a AxiomCircuitProvider");
  }
  return context;
}

function AxiomCircuitProvider({
  provider,
  compiledCircuit,
  chainId,
  children,
}: {
  provider: string,
  compiledCircuit: AxiomV2CompiledCircuit,
  chainId: number | string | bigint,
  children: React.ReactNode,
}) {
  const [inputs, setInputs] = useState<any | null>(null);
  const [options, setOptions] = useState<AxiomV2ClientOptions | null>(null);
  const [callback, setCallback] = useState<AxiomV2Callback | null>(null);
  const [refundee, setRefundee] = useState<string | null>(null);
  const [builtQuery, setBuiltQuery] = useState<AxiomV2SendQueryArgs | null>(null);

  const workerApi = useRef<Remote<AxiomCircuit> | null>(null);

  const build = async () => {
    if (!inputs || !callback || !refundee) {
      console.warn("`inputs` or `callback` or `refundee` not set");
      return null;
    }
    if (builtQuery !== null) {
      return null;
    }
    const setup = async () => {
      // Vite-compatible web worker instantiation
      const worker = new Worker(new URL("./worker", import.meta.url), { type: "module" });
      workerApi.current = wrap<AxiomCircuit>(worker);
      if (workerApi.current) {
        await workerApi.current.setup(window.navigator.hardwareConcurrency);
        await workerApi.current.loadSaved({
          config: JSON.stringify(compiledCircuit.config),
          capacity: compiledCircuit.capacity ?? DEFAULT_CAPACITY,
        });
      }
    }

    const generateQuery = async () => {
      if (workerApi.current) {
        await workerApi.current.run();
        const res = await workerApi.current.getSendQueryArgs();
        if (res === undefined) {
          return null;
        }
        setBuiltQuery(JSON.parse(res));
        return JSON.parse(res);
      }
      return null;
    }
    await setup();
    return await generateQuery();
  }

  const reset = () => {
    setBuiltQuery(null);
  }

  const setParams = useCallback((inputs: any, callbackTarget: string, callbackExtraData: string, refundee: string) => {
    if (callbackExtraData === "") {
      callbackExtraData = "0x";
    }
    setInputs(inputs);
    setCallback({
      target: callbackTarget,
      extraData: callbackExtraData,
    });
    setRefundee(refundee);
  }, []);

  const areParamsSet = (inputs !== null && callback !== null);

  const contextValues = {
    setOptions,
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

export { useAxiomCircuit, AxiomCircuitProvider };
