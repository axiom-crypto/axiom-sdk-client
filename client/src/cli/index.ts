import { Command } from "commander";
import { compile } from "@axiom-crypto/circuit/cliHandler";
import { prove } from "@axiom-crypto/circuit/cliHandler";
import { init } from './init';
import { queryParams } from "./queryParams";
import { scaffoldNext } from "../scaffold/nextjs";
import { scaffoldScript } from "../scaffold/script";
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
  .option("-p, --provider [provider]", "provider")
  .option("-i, --inputs [inputs]", "inputs")
  .option("-o, --outputs [outputs]", "outputs")
  .option("-f, --function [function]", "function name in typescript circuit")
  .action(compile);

circuit
  .command("prove")
  .description("prove an Axiom circuit")
  .argument("<circuitPath>", "path to the typescript circuit file")
  .option("-s, --sourceChainId [sourceChainId]", "source chain id")
  .option("-c, --compiled [compiled]", "path of the compiled circuit json file")
  .option("-m, --mock", "generate a mock compute proof")
  .option("-st, --stats", "print stats")
  .option("-p, --provider [provider]", "provider")
  .option("-i, --inputs [inputs]", "inputs")
  .option("-o, --outputs [outputs]", "outputs")
  .option("-f, --function [function]", "function name in typescript circuit")
  .action(prove);

circuit
  .command("query-params")
  .description("generate parameters to send a Query into Axiom")
  .argument("<callback address>", "callback address")
  .option("-s, --sourceChainId [sourceChainId]", "source chain id")
  .option("-r, --refundAddress [refundAddress]", "refundAddress")
  .option("-e, --callbackExtraData [callbackExtraData]", "callback extra data")
  .option("--caller [caller]", "caller (defaults to refundAddress)")
  .option("--maxFeePerGas [maxFeePerGas]", "maxFeePerGas")
  .option("--callbackGasLimit [callbackGasLimit]", "callbackGasLimit")
  .option("-m, --mock", "generate a mock query")
  .option("-p, --provider [provider]", "JSON-RPC provider (https)")
  .option("-pv, --proven [proven]", "`axiom circuit prove` outputs path")
  .option("-o, --outputs [outputs]", "query-params outputs path")
  .option("-a, --args-map", "sendQuery argments output as mapping for use with Forge")
  .action(queryParams);

const scaffold = program.command("scaffold")
  .description("Generate scaffolds for Axiom apps");

scaffold
  .command("nextjs")
  .description("Scaffold a Next.js dApp that incorporates Axiom")
  .option("-p, --path [path]", "Next.js dApp path", "app/")
  .action(scaffoldNext)

scaffold
  .command("script")
  .description("Scaffold a script to send Axiom Queries")
  .option("-p, --path [path]", "Script path", "app/")
  .action(scaffoldScript)

program.parseAsync(process.argv);
