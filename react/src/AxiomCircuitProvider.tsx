import { 
  AxiomV2CompiledCircuit,
} from "@axiom-crypto/client";
import {
  AxiomCoreCircuitProvider,
  AxiomCircuitContextType,
  AxiomCoreCircuitContext,
} from "./AxiomCoreCircuitProvider";
import { AxiomWorker } from "./workers/axiomWorker";
import { Remote, wrap } from "comlink";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const AxiomCircuitContext = createContext<AxiomCircuitContextType<any> | null>(null);

export const useAxiomCircuit = <T,>(): AxiomCircuitContextType<T> => {
  const context = useContext(AxiomCircuitContext);
  console.log("YJLOG useAxiomCircuit context", context);
  if (context === null) {
    throw new Error("useAxiomCircuit must be used within AxiomCircuitProvider");
  }
  return context;
}

export const AxiomIntermediateCircuitProvider = <T,>({
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
  const coreContext = useContext(AxiomCoreCircuitContext);
  if (coreContext === null) {
    return null;
  }
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
  } = coreContext;

  console.log("YJLOG Caller", caller);

  const workerApi = useRef<Remote<AxiomWorker<T>>>();
  const [isWorkerReady, setIsWorkerReady] = useState(false);

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
          callback: callback ?? { target: "", extraData: "" },
          caller: caller ?? "",
          options: options ?? {},
        },
        window.navigator.hardwareConcurrency,
      );
      if (isMounted) {
        // setIsWorkerReady(true);
        // setWorkerApi(workerApi as React.MutableRefObject<Remote<AxiomWorker<T>>>);
      }
    };

    setupWorker();

    return () => {
      isMounted = false;
    };
  }, [chainId, rpcUrl, compiledCircuit, callback, caller, options]);

  if (!isWorkerReady) {
    console.log("YJLOG Worker not ready");
    return children;
  }

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
      <AxiomIntermediateCircuitProvider chainId={chainId} rpcUrl={rpcUrl} compiledCircuit={compiledCircuit}>
        {children}
      </AxiomIntermediateCircuitProvider>
    </AxiomCoreCircuitProvider>
  )
}

// export const AxiomCircuitProvider = ({
//   compiledCircuit,
//   chainId,
//   rpcUrl,
//   children,
// }: {
//   chainId: number | string | bigint,
//   rpcUrl: string,
//   compiledCircuit: AxiomV2CompiledCircuit,
//   children: React.ReactNode,
// }) => {

//   const workerApi = useRef<Remote<AxiomWorker<any>>>();
//   const [isWorkerReady, setIsWorkerReady] = useState(false);

//   useEffect(() => {
//     const setupWorker = async () => {
//       const worker = new Worker(new URL("./workers/axiomWorker", import.meta.url), { type: "module" });
//       const WrappedAxiomWorker = wrap<typeof AxiomWorker>(worker);
//       workerApi.current = await new WrappedAxiomWorker(
//         {
//           chainId: chainId.toString(),
//           rpcUrl,
//           compiledCircuit,
//           callback: callback ?? { target: "", extraData: "" },
//           caller: caller ?? "",
//           options: options ?? {},
//         },
//         window.navigator.hardwareConcurrency,
//       );
//       setIsWorkerReady(true);
//     };

//     setupWorker();
//   }, [chainId, rpcUrl, compiledCircuit, callback, caller, options]);

//   if (!isWorkerReady) {
//     return null; // or a loading spinner
//   }
  
//   return (
//     <AxiomCoreCircuitProvider>
//       <AxiomIntermediateCircuitinId={chainId} rpcUrl={rpcUrl} compiledCircuit={compiledCircuit}>
//         {children}
//       </AxiomIntermediateCircuit     </AxiomCoreCircuitProvider>
//   )
// }

//   const [inputs, setInputs] = useState<any | null>(null);
//   const [options, setOptions] = useState<AxiomV2QueryOptions | null>(null);
//   const [callback, setCallback] = useState<AxiomV2Callback | null>(null);
//   const [caller, setCaller] = useState<string | null>(null);
//   const [builtQuery, setBuiltQuery] = useState<AxiomV2SendQueryArgs | null>(null);

//   const workerApi = useRef<Remote<AxiomCircuit>>();

//   const build = async () => {
//     if (!inputs || !callback || !caller) {
//       console.warn("`inputs` or `callback` or `caller` not set");
//       return null;
//     }
//     if (builtQuery !== null) {
//       return null;
//     }

//     const setup = async () => {
//       const worker = new Worker(new URL("./worker", import.meta.url), { type: "module" });
//       const AxiomCircuitWorker = wrap<typeof AxiomCircuit>(worker);
//       workerApi.current = await new AxiomCircuitWorker({
//         chainId,
//         rpcUrl,
//         inputSchema: compiledCircuit.inputSchema,
//         f: compiledCircuit.circuit,
//       });
//       await workerApi.current.setup(window.navigator.hardwareConcurrency);
//       await workerApi.current.loadSaved({
//         config: compiledCircuit.config,
//         capacity: compiledCircuit.capacity ?? DEFAULT_CAPACITY,
//         vk: compiledCircuit.vk,
//       });
//     }

//     const generateQuery = async () => {
//       if (!workerApi.current) {
//         console.warn("Worker API not set up");
//         return null;
//       }
//       await workerApi.current.run(inputs);
//       const circuit = workerApi.current!;
//       const axiomV2QueryAddress = getAxiomV2QueryAddress(chainId.toString());
//       const dataQuery = await circuit.getDataQuery();
//       if (!dataQuery) {
//         console.warn("Unable to get dataQuery from circuit");
//         return null;
//       }
//       const computeQuery = await circuit.getComputeQuery();
//       if (!computeQuery) {
//         console.warn("Unable to get computeQuery from circuit");
//         return null;
//       }
//       const sendQueryArgs = await buildSendQuery({
//         chainId: chainId.toString(),
//         rpcUrl,
//         axiomV2QueryAddress,
//         dataQuery,
//         computeQuery,
//         callback,
//         caller,
//         mock: false,
//         options: options ?? {},
//       });
//       if (sendQueryArgs === undefined) {
//         return null;
//       }
//       setBuiltQuery(sendQueryArgs);
//       return sendQueryArgs;
//     }
//     await setup();
//     return await generateQuery();
//   }

//   const reset = () => {
//     setBuiltQuery(null);
//   }

//   const setParams = useCallback((inputs: any, callbackTarget: string, callbackExtraData: string, caller: string, options?: AxiomV2QueryOptions) => {
//     if (callbackExtraData === "") {
//       callbackExtraData = "0x";
//     }
//     setInputs(inputs);
//     setCallback({
//       target: callbackTarget,
//       extraData: callbackExtraData,
//     });
//     setCaller(caller);
//     setOptions(options ?? {});
//   }, []);

//   const areParamsSet = (inputs !== null && callback !== null);

//   const contextValues = {
//     setParams,
//     areParamsSet,
//     build,
//     builtQuery,
//     reset,
//   };

//   return (
//     <AxiomCircuitContext.Provider value={contextValues}>
//       {children}
//     </AxiomCircuitContext.Provider>
//   )
// }
