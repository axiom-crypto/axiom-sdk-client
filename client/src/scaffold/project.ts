import fs from 'fs';
import path from 'path';
import util from 'util';
import childProcess from 'child_process';
import { getInstallCmd } from './utils';
import { ScaffoldManager } from './scaffoldManager';
const exec = util.promisify(childProcess.exec);

export const scaffoldProject = async (sm: ScaffoldManager) => {
  // Create folder if it doesn't exist
  if (!sm.exists(".", `Directory exists? ${sm.basePath}`)) {
    sm.mkdir(sm.basePath, `Create directory: ${sm.basePath}`);
  }

  // Check if package.json exists and if not then initialize
  if (!sm.exists("package.json", "package.json exists?")) {
    console.log("Initializing node package...");
    await sm.exec(`${sm.packageMgr} init${sm.packageMgr === "pnpm" ? "" : " -y"}`, "Initialize node project");
  }

  // Install package dependencies
  console.log("Installing node dependencies");
  await sm.exec(`${sm.packageMgr} ${sm.installCmd} @axiom-crypto/client`, "Install '@axiom-crypto/client'");

  // Check if forge initialized at path and run forge init if not
  console.log("foundry path:", path.join(sm.fullPath, "foundry.toml"));
  if (!sm.exists("foundry.toml", "foundry.toml exists?")) {
    console.log("Initializing Foundry");
    await sm.exec("forge init --no-commit --force", "Initialize forge");

    // Remove default foundry files in new project
    sm.rm(path.join("src", "Counter.sol"), `Remove foundry default template file '${path.join("src", "Counter.sol")}'`);
    sm.rm(path.join("script", "Counter.s.sol"), `Remove foundry default template file '${path.join("script", "Counter.s.sol")}'`);
    sm.rm(path.join("test", "Counter.t.sol"), `Remove foundry default template file '${path.join("test", "Counter.t.sol")}'`);
  }

  // Add axiom-v2-contracts to forge 
  console.log("Installing Axiom Solidity libs...");
  await sm.exec("forge install https://github.com/axiom-crypto/axiom-v2-contracts.git --no-commit", "Add AxiomV2 contracts library to forge");

  // Create forge src files
  const fileAvgBal = path.join("src", "AverageBalance.sol");
  if (!sm.exists(fileAvgBal, `${fileAvgBal} exists?`)) {
    console.log("Generating Solidity test files...");
    sm.cpFromTemplate(fileAvgBal, fileAvgBal, `Copy template ${fileAvgBal}`);
  }

  // Create forge test files
  const fileAvgBalTest = path.join("test", "AverageBalance.t.sol");
  if (!sm.exists(fileAvgBalTest, `${fileAvgBalTest} exists?`)) {
    console.log("Generating Solidity test files...");
    sm.cpFromTemplate(fileAvgBalTest, fileAvgBalTest, `Copy template ${fileAvgBalTest}`);
  }

  // Create Axiom circuit folder
  const axiomPath = path.join("app", "axiom");
  if (!sm.exists(axiomPath, "Axiom path exists?")) {
    console.log("Generating Axiom circuit path...");
    sm.mkdir(axiomPath, `Create Axiom path ${axiomPath}`)
  }

  // Create Axiom example typescript circuit
  const axiomCircuitPath = path.join(axiomPath, "average.circuit.ts");
  if (!sm.exists(axiomCircuitPath, "average.circuit.ts exists?")) {
    console.log("Generating Axiom example circuit...");
    sm.cpFromTemplate(axiomCircuitPath, axiomCircuitPath, `Copy template ${axiomCircuitPath}`);
  }
}