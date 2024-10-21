import { Command } from "commander";
import { compile } from "@axiom-crypto/circuit/cliHandler";
import { prove } from "@axiom-crypto/circuit/cliHandler";
import { queryParams } from "./queryParams";
import { CLIENT_VERSION } from "../version";

const program = new Command('axiom');

program.name("axiom").version(CLIENT_VERSION).description("Axiom CLI");

const circuit = program.command("circuit")
  .description("Axiom circuit commands");

circuit
  .command("compile")
  .description("compile an Axiom circuit")
  .argument("<*.circuit.ts file>", "path to the typescript circuit file")
  .option("-st, --stats", "print stats")
  .option("-m, --mock", "generate a mock vkey and query schema")
  .option("-sr, --rpc-url <https url>", "source chain JSON-RPC provider URL (https)")
  .option("-o, --outputs <outputs>", "outputs json file")
  .option("-f, --function <function>", "function name in typescript circuit")
  .option("-c, --cache <cache>", "cache output file")
  .option("-d, --default-inputs <json file>", "default inputs json file")
  .option("--force", "force compilation even if output file exists")
  .action(compile);

circuit
  .command("prove")
  .description("prove an Axiom circuit")
  .argument("<compiled json>", "path to the compiled circuit json file")
  .argument("<inputs json>", "path to the inputs json file")
  .option("-s, --source-chain-id <chain id>", "source chain id")
  .option("-sr, --rpc-url <https url>", "source chain JSON-RPC provider URL (https)")
  .option("-m, --mock", "generate a mock compute proof")
  .option("-st, --stats", "print stats")
  .option("-o, --outputs <outputs>", "outputs json file")
  .option("-c, --cache <cache>", "cache input file")
  .action(prove);

circuit
  .command("query-params")
  .description("generate parameters to send a Query into Axiom")
  .argument("<callback address>", "target contract address for the callback")
  .requiredOption("-r, --refund-address <address>", "address to refund excess payment")
  .requiredOption("-s, --source-chain-id <chain id>", "source chain id")
  .option("-sr, --rpc-url <https url>", "source chain JSON-RPC provider URL (https)")
  .option("-e, --callback-extra-data <data>", "callback extra data (hex)")
  .option("--caller <caller>", "caller (defaults to refundAddress)")
  .option("--max-fee-per-gas <maxFeePerGas>", "max fee per gas in wei")
  .option("--callback-gas-limit <callbackGasLimit>", "callbackGasLimit")
  .option("-m, --mock", "generate a mock query")
  .option("-pv, --proven <proven>", "`axiom circuit prove` outputs path")
  .option("-o, --outputs <outputs>", "query-params outputs path")
  .option("-a, --args-map", "sendQuery argments output as mapping for use with Forge")
  .action(queryParams);

program.parseAsync(process.argv);
