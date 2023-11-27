import { Command } from 'commander';
import { compile } from './compile';
import { run } from './run';
import { sendQuery } from './sendQuery';

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
    .action(run)

program
    .command("sendQuery")
    .description("get args / calldata necessary to send an Axiom query")
    .option("-s, --stats", "print stats")
    .option("-p, --provider [provider]", "provider")
    .option("-m, --mock", "mock")
    .option("-c, --calldata", "calldata")
    .option("-a, --args", "args")
    .option("-i, --input [input]", "input", "data/output.json")
    .option("-o, --output [output]", "output", "data/sendQuery.json")
    .option("-r, --refundAddress [refundAddress]", "refundAddress")
    .option("--caller [caller]", "caller (defaults to refundAddress)")
    .action(sendQuery)

program.parseAsync(process.argv)