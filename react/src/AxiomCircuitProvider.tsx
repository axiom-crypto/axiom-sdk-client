import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  AxiomV2Callback,
  AxiomV2QueryOptions,
} from "@axiom-crypto/core";
import { CircuitConfig } from "@axiom-crypto/core/halo2-js";
import { Remote, wrap } from "comlink";
import { AxiomCircuit } from "./worker";

type BuiltQuery = {
  calldata: `0x${string}`;
  address: `0x${string}`;
  abi: any;
  functionName: string;
  value: bigint;
  args: any[];
  queryId: string;
}

type AxiomCircuitContextType<T> = {
  setOptions: React.Dispatch<React.SetStateAction<AxiomV2QueryOptions | null>>,
  setParams: (inputs: T, callbackAddress: string, callbackExtraData: string, refundee: string) => void,
  areParamsSet: boolean,
  build: () => Promise<BuiltQuery | null>,
  builtQuery: BuiltQuery | null,
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
  providerUri,
  build: _build,
  chainId,
  mock,
  children,
}: {
  build: {
    vk: string,
    config: CircuitConfig,
    querySchema: string,
    inputSchema: string,
    circuit: string,
  }
  providerUri: string,
  chainId?: number | string | bigint,
  mock?: boolean,
  children: React.ReactNode,
}) {
  const [inputs, setInputs] = useState<any | null>(null);
  const [options, setOptions] = useState<AxiomV2QueryOptions | null>(null);
  const [callback, setCallback] = useState<AxiomV2Callback | null>(null);
  const [refundee, setRefundee] = useState<string | null>(null);
  const [builtQuery, setBuiltQuery] = useState<BuiltQuery | null>(null);

  const workerApi = useRef<Remote<AxiomCircuit>>();

  const build = async () => {
    if (!inputs || !callback || !refundee) {
      console.warn("`inputs` or `callback` or `refundee` not set");
      return null;
    }
    if (builtQuery !== null) {
      return null;
    }
    const setup = async () => {
      const worker = new Worker(new URL("./worker", import.meta.url), { type: "module" });
      const MyAxiomCircuit = wrap<typeof AxiomCircuit>(worker);
      workerApi.current = await new MyAxiomCircuit({
        provider: providerUri,
        inputSchema: _build.inputSchema,
        mock,
        chainId,
        f: _build.circuit,
      });
      await workerApi.current.setup(window.navigator.hardwareConcurrency);
      await workerApi.current?.loadSaved(_build);
    }

    const generateQuery = async () => {
      await workerApi.current?.run(inputs);
      const res = await workerApi.current?.getSendQueryArgs({
        options: options ?? {refundee},
        callbackTarget: callback.target,
        callbackExtraData: callback.extraData,
        callerAddress: refundee,
      });
      if (res === undefined) {
        return null;
      }
      setBuiltQuery(res);
      return res;
    }
    await setup();
    return await generateQuery();
  }

  const reset = () => {
    setBuiltQuery(null);
  }

  const setParams = useCallback((inputs: any, calllbackAddress: string, callbackExtraData: string, refundee: string) => {
    setInputs(inputs);
    setCallback({
      target: calllbackAddress,
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
