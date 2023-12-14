import { Command } from "commander";
import { run } from "./run";

const harness = new Command('harness');

harness
  .name("harness")
  .version("0.1.3")
  .description("Axiom circuit harness");

harness
  .command("run")
  .description("Get circuit parameters from javascript circuit")
  .argument("<js circuit path>", "js circuit path")
  .option("-o, --output [output]", "output folder", "data")
  .option("-f, --function [function]", "function name", "circuit")
  .option("-p, --provider [provider]", "provider")
  .action(run);

harness.parseAsync(process.argv);
