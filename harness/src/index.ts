import { Command } from "commander";
import { run } from "./run";

const harnessCli = new Command('harness');

harnessCli
  .name("harness")
  .version("0.1.4")
  .description("Axiom circuit harness");

harnessCli
  .command("run")
  .description("Get circuit parameters from javascript circuit")
  .argument("<js circuit path>", "js circuit path")
  .option("-o, --output [output]", "output folder", "data")
  .option("-f, --function [function]", "function name", "circuit")
  .option("-p, --provider [provider]", "provider")
  .action(run);

harnessCli.parseAsync(process.argv);

export { run as harness };
