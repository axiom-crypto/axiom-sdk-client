import { Command } from "commander";
import { compile } from "@axiom-crypto/circuit";
import { run } from "@axiom-crypto/circuit";
import { sendQuery } from "./sendQuery";

const program = new Command('axiom');

program.name("axiom").version("0.1.3").description("Axiom CLI");

program
  .command("compile")
  .description("compile an Axiom circuit")
  .argument("<circuit path>", "circuit path")
  .option("-s, --stats", "print stats")
  .option("-p, --provider [provider]", "provider")
  .option("-i, --inputs [inputs]", "inputs")
  .option("-o, --output [output]", "output", "data/build.json")
  .option("-f, --function [function]", "function name", "circuit")
  .action(compile);

program
  .command("run")
  .description("run an Axiom circuit")
  .argument("<circuit path>", "circuit path")
  .option("-b, --build [build]", "build path", "data/build.json")
  .option("-s, --stats", "print stats")
  .option("-p, --provider [provider]", "provider")
  .option("-i, --inputs [inputs]", "inputs")
  .option("-o, --output [output]", "output", "data/output.json")
  .option("-f, --function [function]", "function name", "circuit")
  .action(run);

program
  .command("sendQueryArgs")
  .description("get args / calldata necessary to send an Axiom query")
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

program.parseAsync(process.argv);
