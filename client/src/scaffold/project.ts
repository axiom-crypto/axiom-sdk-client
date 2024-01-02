import path from 'path';
import chalk from 'chalk';
import { ScaffoldManager } from './scaffoldManager';

export const scaffoldProject = async (sm: ScaffoldManager) => {
  // Create folder if it doesn't exist
  if (!sm.exists(".", `Directory ${chalk.bold(sm.basePath)} exists?`)) {
    sm.mkdir(".", `  - Create directory ${chalk.bold(sm.basePath)}`);
  }

  // Check if folder is a git repository and if not then initialize
  if (!sm.exists(".git", `Directory ${chalk.bold(sm.basePath)} is a git repository?`)) {
    await sm.exec(`git init`, "  - Initialize git repository");
  }

  // Check if package.json exists and if not then initialize
  if (!sm.exists("package.json", `${chalk.bold("package.json")} exists?`)) {
    console.log("Initializing node package...");
    await sm.exec(`${sm.packageMgr} init${sm.packageMgr === "pnpm" ? "" : " -y"}`, "  - Initialize node project");
  }

  // Install package dependencies
  console.log("Installing node dependencies...");
  await sm.exec(`${sm.packageMgr} ${sm.installCmd} @axiom-crypto/client`, `Install ${chalk.bold("@axiom-crypto/client")}`);

  // Check if forge initialized at path and run forge init if not
  if (!sm.exists("foundry.toml", `${chalk.bold("foundry.toml")} exists?`)) {
    console.log("Initializing Foundry...");
    const { err } = await sm.exec("forge init --no-commit --force", "  - Initialize forge");

    if (!err) {
      // Remove default foundry files in new project
      sm.rm(path.join("src", "Counter.sol"), `  - Remove foundry default template file ${chalk.bold(path.join("src", "Counter.sol"))}`);
      sm.rm(path.join("script", "Counter.s.sol"), `  - Remove foundry default template file ${chalk.bold(path.join("script", "Counter.s.sol"))}`);
      sm.rm(path.join("test", "Counter.t.sol"), `  - Remove foundry default template file ${chalk.bold(path.join("test", "Counter.t.sol"))}`);
    }
  }

  // Add axiom-v2-contracts to forge 
  console.log("Installing Axiom Solidity libraries...");
  await sm.exec("forge install https://github.com/axiom-crypto/axiom-v2-contracts.git --no-commit", `Add ${chalk.bold("axiom-v2-contracts")} library to forge`);

  // Create forge src files
  const fileAvgBal = path.join("src", "AverageBalance.sol");
  if (!sm.exists(fileAvgBal, `${chalk.bold(fileAvgBal)} exists?`)) {
    console.log("Generating Solidity test files...");
    sm.cpFromTemplate(fileAvgBal, fileAvgBal, `  - Copy template ${chalk.bold(fileAvgBal)}`);
  }

  // Create forge test files
  const fileAvgBalTest = path.join("test", "AverageBalance.t.sol");
  if (!sm.exists(fileAvgBalTest, `${chalk.bold(fileAvgBalTest)} exists?`)) {
    console.log("Generating Solidity test files...");
    sm.cpFromTemplate(fileAvgBalTest, fileAvgBalTest, `  - Copy template ${chalk.bold(fileAvgBalTest)}`);
  }

  // Create Axiom circuit folder
  const axiomPath = path.join("app", "axiom");
  if (!sm.exists(axiomPath, `${chalk.bold(axiomPath)} path exists?`)) {
    console.log("Generating Axiom circuit path...");
    sm.mkdir(axiomPath, `  - Create Axiom path ${chalk.bold(axiomPath)}`)
  }

  // Create Axiom example typescript circuit
  const axiomCircuitFile = path.join(axiomPath, "average.circuit.ts");
  if (!sm.exists(axiomCircuitFile, `${chalk.bold(axiomCircuitFile)} exists?`)) {
    console.log("Generating Axiom example circuit...");
    sm.cpFromTemplate(axiomCircuitFile, axiomCircuitFile, `  - Copy template ${chalk.bold(axiomCircuitFile)}`);
  }
}