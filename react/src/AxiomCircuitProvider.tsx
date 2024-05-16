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
  DEFAULT_CAPACITY,
} from "@axiom-crypto/client";
import { getAxiomV2QueryAddress } from '@axiom-crypto/client/lib/address';
import { AxiomCircuitContext, AxiomCoreCircuitProvider } from "./AxiomCoreCircuitProvider";

export { useAxiomCircuit } from "./AxiomCoreCircuitProvider";

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
    <AxiomCoreCircuitProvider
      compiledCircuit={compiledCircuit}
      chainId={chainId}
      rpcUrl={rpcUrl}
    >
      {children}
    </AxiomCoreCircuitProvider>
  )
}

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
