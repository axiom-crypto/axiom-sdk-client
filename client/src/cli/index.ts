import { Command } from "commander";
import { compile } from "@axiom-crypto/circuit/cliHandler";
import { prove } from "@axiom-crypto/circuit/cliHandler";
import { init } from './init';
import { queryParams } from "./queryParams";
import { scaffoldNext } from "../projectScaffold/nextjs";
import { scaffoldScript } from "../projectScaffold/script";
import { CLIENT_VERSION } from "../version";

const program = new Command('axiom');

program.name("axiom").version(CLIENT_VERSION).description("Axiom CLI");

program
  .command("init")
  .description("initialize Axiom project")
  .option("-p, --path [path]", "file path")
  .option("-s, --scaffold [type]", "type of scaffold (nextjs, script, none)")
  .option("-m, --manager [name]", "package manager to use (npm, yarn, pnpm)")
  .action(init);

const circuit = program.command("circuit")
  .description("Axiom circuit commands");

circuit
  .command("compile")
  .description("compile an Axiom circuit")
  .argument("<circuitPath>", "path to the typescript circuit file")
  .option("-st, --stats", "print stats")
  .option("-m, --mock", "generate a mock vkey and query schema")
  .option("-r, --rpcUrl [rpcUrl]", "source chain JSON-RPC provider URL (https)")
  .option("-o, --outputs [outputs]", "outputs json file")
  .option("-f, --function [function]", "function name in typescript circuit")
  .option("-c, --cache [cache]", "cache output file")
  .option("-d, --defaultInputs [defaultInputs]", "default inputs json file")
  .option("--force", "force compilation even if output file exists")
  .action(compile);

circuit
  .command("prove")
  .description("prove an Axiom circuit")
  .argument("<compiledPath>", "path to the compiled circuit json file")
  .argument("<inputsFile>", "path to the inputs json file")
  .option("-s, --sourceChainId [sourceChainId]", "source chain id")
  .option("-m, --mock", "generate a mock compute proof")
  .option("-st, --stats", "print stats")
  .option("-r, --rpcUrl [rpcUrl]", "source chain JSON-RPC provider URL (https)")
  .option("-o, --outputs [outputs]", "outputs json file")
  .option("-c, --cache [cache]", "cache input file")
  .action(prove);

circuit
  .command("query-params")
  .description("generate parameters to send a Query into Axiom")
  .argument("<callback address>", "callback address")
  .requiredOption("-r, --refundAddress [refundAddress]", "refundAddress")
  .requiredOption("-s, --sourceChainId [sourceChainId]", "source chain id")
  .option("-t, --targetChainId [targetChainId]", "target chain id")
  .option("-b, --bridgeId [bridgeId]", "bridge id", parseInt)
  .option("-e, --callbackExtraData [callbackExtraData]", "callback extra data")
  .option("--caller [caller]", "caller (defaults to refundAddress)")
  .option("--maxFeePerGas [maxFeePerGas]", "maxFeePerGas")
  .option("--callbackGasLimit [callbackGasLimit]", "callbackGasLimit")
  .option("-m, --mock", "generate a mock query")
  .option("-r, --rpcUrl [rpcUrl]", "source chain JSON-RPC provider URL (https)")
  .option("-tr, --targetRpcUrl [targetRpcUrl]", "target chain JSON-RPC provider URL (https)")
  .option("-pv, --proven [proven]", "`axiom circuit prove` outputs path")
  .option("-o, --outputs [outputs]", "query-params outputs path")
  .option("-a, --args-map", "sendQuery argments output as mapping for use with Forge")
  .option("-br, --isBroadcaster", "Use crosschain broadcaster")
  .option("-bo, --isBlockhashOracle", "Use crosschain blockhash oracle")
  .action(queryParams);

const scaffold = program.command("scaffold")
  .description("Generate scaffolds for Axiom apps");

scaffold
  .command("nextjs")
  .description("Scaffold a Next.js dApp that incorporates Axiom")
  .option("-p, --path [path]", "Next.js dApp path")
  .option("-m, --manager [name]", "package manager to use (npm, yarn, pnpm)")
  .action(scaffoldNext)

scaffold
  .command("script")
  .description("Scaffold a script to send Axiom Queries")
  .option("-p, --path [path]", "Script path")
  .option("-m, --manager [name]", "package manager to use (npm, yarn, pnpm)")
  .action(scaffoldScript)

program.parseAsync(process.argv);
