import chalk from 'chalk';
import { ScaffoldManager } from './scaffoldManager';

export const scaffoldNext = async (sm: ScaffoldManager) => {

  // Create folder if it doesn't exist
  if (!sm.exists(".", `Directory ${chalk.bold(sm.basePath)} exists?`)) {
    sm.mkdir(".", `  - Create directory ${chalk.bold(sm.basePath)}`);
  }

  console.log("Fetching Axiom Next.js template...");
  await sm.exec(`git clone --depth 1 -b update https://github.com/axiom-crypto/axiom-scaffold-nextjs.git ${sm.basePath}`, "Clone Axiom quickstart template", { inPlace: true });

  // Install package dependencies
  console.log("Installing dependencies...");
  await sm.execWithStream(sm.packageMgr, [sm.installCmd], `Installing dependencies`);

  //Initialize Git repo
  await sm.exec(`rm -rf .git && git init`, "Initialize git repository");

  // Create .env file
  sm.cp(`.env.local.example`, ".env.local", `Create ${chalk.bold(".env")}`);
  console.log("Fill in .env.local with your environment variables.");
}