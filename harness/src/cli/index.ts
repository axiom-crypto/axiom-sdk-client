import { Command } from "commander";
import { harness } from '../harness';
import { HARNESS_VERSION } from "../version";

const harnessCli = new Command('harness');

harnessCli
  .name("harness")
  .version(HARNESS_VERSION)
  .description("Axiom circuit harness");

harnessCli
  .command("run")
  .description("Get circuit parameters from javascript circuit")
  .argument("<js circuit path>", "js circuit path")
  .option("-o, --output [output]", "output folder", "data")
  .option("-f, --function [function]", "function name", "circuit")
  .option("-p, --provider [provider]", "provider")
  .action(harness);

harnessCli.parseAsync(process.argv);