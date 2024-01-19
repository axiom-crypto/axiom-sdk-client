import path from 'path';
import chalk from 'chalk';
import { ScaffoldManager } from "./scaffoldManager";

export const scaffoldNext = async (
  options: {
    path: string,
    packageMgr: string,
  },
  sm?: ScaffoldManager,
) => {
  let shouldPrint = false;
  if (sm === undefined) {
    shouldPrint = true;
    sm = new ScaffoldManager(options.path, options.packageMgr);
  }
  
  console.log("Fetching Axiom next.js scaffold...");
  await sm.exec(`git clone -b staging https://github.com/axiom-crypto/axiom-scaffold-nextjs.git ${options.path}`, "Clone Axiom next.js scaffold");

  sm.rm(path.join(options.path, ".git"), `  - Remove scaffold ${chalk.bold(".git")} folder`);

  if (shouldPrint) {
    sm.report();
  }
}