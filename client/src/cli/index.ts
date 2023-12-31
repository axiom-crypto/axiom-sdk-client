import { Command } from "commander";
import { compile } from "@axiom-crypto/circuit";
import { run } from "@axiom-crypto/circuit";
import { init } from './init';
import { sendQuery } from "./sendQuery";
import { CLIENT_VERSION } from "../version";
import { scaffoldNext, scaffoldScript } from "./scaffold";

const program = new Command('axiom');

program.name("axiom").version(CLIENT_VERSION).description("Axiom CLI");

program
  .command("init")
  .description("initialize Axiom circuit files")
  .option("-p, --path [path]", "file path", "app/axiom")
  .action(init);

const circuit = program.command("circuit")
  .description("Axiom circuit commands");

circuit
  .command("compile")
  .description("compile an Axiom circuit")
  .argument("<circuit path>", "circuit path")
  .option("-s, --stats", "print stats")
  .option("-p, --provider [provider]", "provider")
  .option("-i, --input [inputs]", "inputs")
  .option("-o, --output [output]", "output", "data/build.json")
  .option("-f, --function [function]", "function name", "circuit")
  .action(compile);

circuit
  .command("prove")
  .description("prove an Axiom circuit")
  .argument("<circuit path>", "circuit path")
  .option("-s, --sourceChainId [sourceChainId]", "source chain id")
  .option("-b, --build [build]", "build path", "data/build.json")
  .option("-t, --stats", "print stats")
  .option("-p, --provider [provider]", "provider")
  .option("-i, --input [inputs]", "inputs")
  .option("-o, --output [output]", "output", "data/output.json")
  .option("-f, --function [function]", "function name", "circuit")
  .action(run);

circuit
  .command("query-params")
  .description("generate parameters to send a Query into Axiom")
  .argument("<callback address>", "callback address")
  .option("-c, --calldata", "output encoded calldata")
  .option("-s, --sourceChainId [sourceChainId]", "source chain id")
  .option("-r, --refundAddress [refundAddress]", "refundAddress")
  .option("-e, --callbackExtraData [callbackExtraData]", "callback extra data")
  .option("--caller [caller]", "caller (defaults to refundAddress)")
  .option("--maxFeePerGas [maxFeePerGas]", "maxFeePerGas")
  .option("--callbackGasLimit [callbackGasLimit]", "callbackGasLimit")
  .option("-p, --provider [provider]", "provider")
  .option("-i, --input [input]", "circuit run output path", "data/output.json")
  .option(
    "-o, --output [output]",
    "sendQueryArgs output path",
    "data/sendQuery.json",
  )
  .action(sendQuery);

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
