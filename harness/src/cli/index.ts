import { Command } from "commander";
import { run } from '../run/run';
import { search } from "../search/search";
import { HARNESS_VERSION } from "../version";
import { generateInputs } from "../run";
import { compile, prove, sendQuery } from "./handlers";

const harnessCli = new Command('harness');

harnessCli
  .name("harness")
  .version(HARNESS_VERSION)
  .description("Axiom circuit test harness");

harnessCli
  .command("search")
  .description("Search for a chain data and generate a json output")
  .requiredOption("-sr, --rpc-url <RPC https url>", "Source chain JSON-RPC provider URL")
  .option("-s, --samples <samples>", "Number of blocks to sample (default: 128)", Number)
  .option("-i, --interval <interval>", "Interval between samples (default: 64)", Number)
  .option("-b, --block <block>", "Start at block number and work backwards (default: latest)", Number)
  .option("-in, --include <include>", "Comma-separated block numbers to include in the search (useful if certain events happened at specific blocks)")
  .option("-ig, --ignore <ignore>", "Comma-separated string slices of addresses to ignore")
  .option("-o, --output <output>", "Output file path (default: ./output)", "./output")
  .action(search);

harnessCli
  .command("generate-inputs")
  .description("Generate inputs for a circuit")
  .argument("<circuit>", "path to the typescript circuit file")
  .argument("<output path>", "path to write generated inputs to")
  .argument("<chain data>", "path to the chain data json file")
  .action(generateInputs);

harnessCli
  .command("compile")
  .description("Compiles the circuit with generated inputs")
  .argument("<rpc-url>", "Source chain JSON-RPC provider URL")
  .argument("<circuit>", "path to the typescript circuit file")
  .argument("<inputs path>", "path to the generated inputs")
  .argument("<output path>", "path to write the compiled circuit to")
  .action(compile);

harnessCli
  .command("prove")
  .description("Prove the circuit")
  .argument("<chain id>", "source chain ID")
  .argument("<rpc-url>", "Source chain JSON-RPC provider URL")
  .argument("<circuit>", "path to the typescript circuit file")
  .argument("<compiled circuit>", "path to the compiled circuit json file")
  .argument("<inputs path>", "path to the inputs json file")
  .action(prove);

harnessCli
  .command("send-query")
  .description("Send a query to AxiomV2Query")
  .argument("<chain id>", "source chain ID")
  .argument("<rpc-url>", "Source chain JSON-RPC provider URL")
  .argument("<circuit>", "path to the typescript circuit file")
  .argument("<compiled circuit>", "path to the compiled circuit json file")
  .argument("<inputs path>", "path to the inputs json file")
  .action(sendQuery);

harnessCli
  .command("run")
  .description("Runs `generate-inputs`, `compile`, `prove`, and (optionally) `send-query` in sequence")
  .requiredOption("-c, --circuit <path>", "js circuit path")
  .requiredOption("-sr, --rpc-url <RPC https url>", "Source chain JSON-RPC provider URL")
  .requiredOption("-d, --data <path>", "Chain data json file path (output of `search` command)")
  .option("-o, --output <path>", "Folder for outputs (default: ../output)", "../output")
  .option("-ci, --circuit-inputs-path <path>", "Path to circuit inputs (default: <chainDataPath>/<chainId>)")
  .option("-f, --function <fnName>", "Function name (default: circuit)", "circuit")
  .option("--send", "Send query after proving")
  .action(run);

harnessCli.parseAsync(process.argv);