import { Command } from "commander";
import { run } from '../run/run';
import { search } from "../search/search";
import { HARNESS_VERSION } from "../version";

const harnessCli = new Command('harness');

harnessCli
  .name("harness")
  .version(HARNESS_VERSION)
  .description("Axiom circuit test harness");

harnessCli
  .command("search")
  .description("Search for a chain data and generate a json output")
  .requiredOption("-p, --provider [provider]", "Node provider for the chain")
  .option("-s, --samples [samples]", "Number of blocks to sample (default: 128)", Number)
  .option("-i, --interval [interval]", "Interval between samples (default: 64)", Number)
  .option("-b, --block [block]", "Start at block number and work backwards (default: latest)", Number)
  .option("-in, --include [include]", "Comma-separated block numbers to include in the search (useful if certain events happened at specific blocks)")
  .option("-ig, --ignore [ignore]", "Comma-separated string slices of addresses to ignore")
  .option("-o, --output [output]", "Output file path (default: ./output)", "./output")
  .action(search);

harnessCli
  .command("run")
  .description("Run a test on a circuit file")
  .requiredOption("-c, --circuit [path]", "js circuit path")
  .requiredOption("-p, --provider [provider]", "Node provider for the chain")
  .requiredOption("-d, --data [path]", "Chain data json file path (output of `search` command)")
  .option("-o, --output [output]", "Folder for outputs (default: ../output)", "../output")
  .option("-f, --function [function]", "Function name (default: circuit)", "circuit")
  .option("--send", "Send query after proving")
  .action(run);

harnessCli.parseAsync(process.argv);