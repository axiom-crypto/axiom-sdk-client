import { Command } from 'commander';
import { compile } from './compile';

const program = new Command();

program
    .name("axiom")
    .version("0.1.0")
    .description("axiom CLI")

program
    .command("compile")
    .description("compile an Axiom circuit")
    .argument("<circuit path>", "circuit path")
    .option("-s, --stats", "print stats")
    .option("-p, --provider [provider]", "provider")
    .option("-i, --inputs [inputs]", "inputs")
    .option("-o, --output [output]", "output", "data/build.json")
    .option("-f, --function [function]", "function name", "circuit")
    .action(compile)

program.parseAsync(process.argv)