import path from 'path';
import chalk from 'chalk';
import { ProjectScaffoldManager } from './projectScaffoldManager';
import { CLIENT_VERSION } from '../version';

export const scaffoldProject = async (sm: ProjectScaffoldManager, appScaffold: string) => {
  const startingDir = process.cwd();

  // Create folder if it doesn't exist
  if (!sm.exists(".", `Directory ${chalk.bold(sm.basePath)} exists?`)) {
    sm.mkdir(".", `  - Create directory ${chalk.bold(sm.basePath)}`);
  }

  // Move to base path
  process.chdir(sm.basePath);

  // Check if folder is a git repository and if not then initialize
  if (!sm.exists(".git", `Directory ${chalk.bold(sm.basePath)} is a git repository?`)) {
    await sm.exec(`git init`, "  - Initialize git repository");
  }

  // Check if package.json exists and if not then initialize
  if (!sm.exists("package.json", `${chalk.bold("package.json")} exists?`)) {
    console.log("Initializing node package...");
    await sm.exec(`${sm.packageMgr} init${sm.packageMgr === "pnpm" ? "" : " -y"}`, "  - Initialize node project");
    await sm.exec(`echo "node_modules" >> .gitignore`, "  - Add node_modules to .gitignore");
  }

  // Install package dependencies
  console.log("Installing node dependencies...");
  await sm.exec(`${sm.packageMgr} ${sm.installCmd} @axiom-crypto/client@${CLIENT_VERSION}`, `  - Install ${chalk.bold("@axiom-crypto/client")}`);
  await sm.exec(`${sm.packageMgr} ${sm.installCmd} dotenv`, `  - Install ${chalk.bold("dotenv")}`);
  await sm.exec(`${sm.packageMgr} ${sm.installCmd} ${sm.devFlag} typescript`, `  - Install (dev) ${chalk.bold("typescript")}`);
  await sm.exec(`${sm.packageMgr} ${sm.installCmd} ${sm.devFlag} tsx`, `  - Install (dev) ${chalk.bold("tsx")}`);

  const tempDir = `.axiom-temp-${Date.now()}`;
  console.log("Fetching Axiom quickstart template...");
  await sm.exec(`git clone --depth 1 https://github.com/axiom-crypto/axiom-quickstart.git ${tempDir}`, "Clone Axiom quickstart template");

  // Check if `node_modules` is in .gitignore and if not then add
  if (!sm.exists(".gitignore", `${chalk.bold(".gitignore")} exists?`)) {
    await sm.exec(`echo "node_modules" >> .gitignore`, "  - Add node_modules to .gitignore");
  } else {
    const gitignore = sm.readFile(".gitignore");
    if (!gitignore.includes("node_modules")) {
      await sm.exec(`echo "node_modules" >> .gitignore`, "  - Add node_modules to .gitignore");
    }
  }

  // Check if forge initialized at path and run forge init if not
  if (!sm.exists("foundry.toml", `${chalk.bold("foundry.toml")} exists?`)) {
    console.log("Initializing Foundry...");
    const { err } = await sm.exec("forge init --no-commit --force", "  - Initialize forge");

    sm.cp(`${tempDir}/foundry.toml`, "foundry.toml", `  - Copy template ${chalk.bold("foundry.toml")}`);

    if (!err) {
      // Remove default foundry files in new project
      sm.rm(path.join("src", "Counter.sol"), `  - Remove foundry default template file ${chalk.bold(path.join("src", "Counter.sol"))}`);
      sm.rm(path.join("script", "Counter.s.sol"), `  - Remove foundry default template file ${chalk.bold(path.join("script", "Counter.s.sol"))}`);
      sm.rm(path.join("test", "Counter.t.sol"), `  - Remove foundry default template file ${chalk.bold(path.join("test", "Counter.t.sol"))}`);
    }
  }

  // Add axiom-v2-periphery to Foundry 
  console.log("Installing @axiom-crypto/v2-periphery Solidity library to Foundry...");
  await sm.exec("forge install axiom-crypto/axiom-v2-periphery --no-commit", `Add ${chalk.bold("@axiom-crypto/v2-periphery")} library to Foundry`);

  // Create forge src files
  const fileAvgBal = path.join("src", "AverageBalance.sol");
  if (!sm.exists(fileAvgBal, `${chalk.bold(fileAvgBal)} exists?`)) {
    console.log("Generating Solidity source files...");
    sm.cp(`${tempDir}/${fileAvgBal}`, fileAvgBal, `  - Copy template ${chalk.bold(fileAvgBal)}`);
  }

  // Create forge test files
  const fileAvgBalTest = path.join("test", "AverageBalance.t.sol");
  if (!sm.exists(fileAvgBalTest, `${chalk.bold(fileAvgBalTest)} exists?`)) {
    console.log("Generating Solidity test files...");
    sm.cp(`${tempDir}/${fileAvgBalTest}`, fileAvgBalTest, `  - Copy template ${chalk.bold(fileAvgBalTest)}`);
  }

  if (appScaffold === "script") {
    const appPath = "app";

    // Create App folder
    if (!sm.exists(appPath, `${chalk.bold(appPath)} path exists?`)) {
      console.log("Generating Axiom app path...");
      sm.mkdir(appPath, `  - Create Axiom path ${chalk.bold(appPath)}`)
    }

    // Copy Axiom script file
    const axiomScriptFile = path.join(appPath, "index.ts");
    if (!sm.exists(axiomScriptFile, `${chalk.bold(axiomScriptFile)} exists?`)) {
      console.log("Generating Axiom Query script...");
      sm.cp(`${tempDir}/${axiomScriptFile}`, axiomScriptFile, `  - Copy template ${chalk.bold(axiomScriptFile)}`);
    }

    // Create Axiom circuit folder
    const axiomPath = path.join(appPath, "axiom");
    if (!sm.exists(axiomPath, `${chalk.bold(axiomPath)} path exists?`)) {
      console.log("Generating Axiom circuit path...");
      sm.mkdir(axiomPath, `  - Create Axiom path ${chalk.bold(axiomPath)}`)
    }

    // Create Axiom example typescript circuit
    const axiomCircuitFile = path.join(axiomPath, "average.circuit.ts");
    if (!sm.exists(axiomCircuitFile, `${chalk.bold(axiomCircuitFile)} exists?`)) {
      console.log("Generating Axiom example circuit...");
      sm.cp(`${tempDir}/${axiomCircuitFile}`, axiomCircuitFile, `  - Copy template ${chalk.bold(axiomCircuitFile)}`);
    }

    // Copy Axiom circuit data
    const axiomDataPath = path.join(axiomPath, "data");
    sm.cp(`${tempDir}/${axiomDataPath}`, axiomDataPath, `  - Copy Axiom circuit data ${chalk.bold(axiomDataPath)}`);
  }

  // Create .env file
  if (!sm.exists(".env", `${chalk.bold(".env")} exists?`)) {
    console.log("Generating .env file...");
    sm.cp(`${tempDir}/.env.example`, ".env", `  - Copy template ${chalk.bold(".env")}`);
    console.log("Fill in .env with your environment variables.");
  }

  // Remove cloned repo
  await sm.exec(`rm -rf ${tempDir}`, "Clean up build files");

  // Move back to starting directory
  process.chdir(startingDir);
}