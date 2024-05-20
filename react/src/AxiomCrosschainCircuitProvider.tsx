// import { 
//   AxiomV2CompiledCircuit,
//   SourceChainConfig,
//   TargetChainConfig,
// } from "@axiom-crypto/client";
// import { AxiomCoreCircuitProvider } from "./AxiomCoreCircuitProvider";
// import { AxiomCrosschainWorker } from "./workers/axiomCrosschainWorker";

// export { useAxiomCircuit } from "./AxiomCoreCircuitProvider";

// const workerApi = useRef<Remote<AxiomCrosschainWorker<typeof inputs>>>();

// export const AxiomCrosschainCircuitProvider = ({
//   compiledCircuit,
//   source,
//   target,
//   children,
// }: {
//   compiledCircuit: AxiomV2CompiledCircuit;
//   source: SourceChainConfig;
//   target: TargetChainConfig;
//   children: React.ReactNode;
// }) => {
//   const worker = new Worker(new URL("./workers/axiomCrosschainWorker", import.meta.url), { type: "module" });
//   const WrappedAxiomCrosschainWorker = wrap<typeof AxiomCrosschainWorker>(worker);
//   workerApi.current = await new WrappedAxiomCrosschainWorker(
//     {
//       source,
//       target,
//       compiledCircuit,
//       callback: target.callback,
//       options: options ?? {},
//     },
//     window.navigator.hardwareConcurrency,
//   );
//   return (
//     <AxiomCoreCircuitProvider<typeof AxiomCrosschainWorker>
//       workerApi={workerApi}
//       compiledCircuit={compiledCircuit}
//       chainId={chainId}
//       rpcUrl={rpcUrl}
//     >
//       {children}
//     </AxiomCoreCircuitProvider>
//   )
// };