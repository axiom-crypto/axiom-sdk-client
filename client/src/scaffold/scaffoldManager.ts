import path from 'path';
import fs from 'fs';
import util from 'util';
import childProcess from 'child_process';
import chalk from 'chalk';
import { getInstallCmd } from './utils';
const exec = util.promisify(childProcess.exec);

export interface Action {
  description: string,
  status: string,
}

export class ScaffoldManager {
  basePath: string;
  fullPath: string;
  packageMgr: string;
  installCmd: string;
  actions: Action[];

  constructor(basePath: string, packageMgr: string) {
    this.basePath = basePath;
    this.fullPath = path.resolve(basePath);
    this.packageMgr = packageMgr;
    this.installCmd = getInstallCmd(packageMgr);
    this.actions = [] as Action[];
  }

  exists(inputPath: string, description: string): boolean {
    const doesExist = fs.existsSync(path.join(this.fullPath, inputPath));
    this.actions.push({
      description,
      status: doesExist ? chalk.yellow("SKIP") : chalk.green("MAKE")
    });
    return doesExist;
  }

  readFile(filePath: string): string {
    return fs.readFileSync(path.join(this.fullPath, filePath), 'utf8');
  }

  mkdir(dir: string, description: string) {
    const res = fs.mkdirSync(path.join(this.fullPath, dir), { recursive: true });
    this.actions.push({
      description,
      status: res!.length === 0 ? chalk.red("ERR") : chalk.green("OK")
    });
  }

  async exec(cmd: string, description: string, options?: { inPlace?: boolean }) {
    let stdout;
    let stderr;
    let err;
    try {
      if (options && options.inPlace) {
        await exec(cmd);
      }
      else {
        await exec(`cd ${this.fullPath} && ${cmd}`);
      }
    } catch (e) {
      err = e;
    }

    this.actions.push({
      description,
      status: err !== undefined ? chalk.red("ERR") : chalk.green("OK")
    });

    return { stdout, stderr, err }
  }

  async execWithStream(cmd: string, args: string[], description: string, options?: { inPlace?: boolean }) {
    return new Promise((resolve, reject) => {
      let cmdString = options && options.inPlace ? cmd : `cd ${this.fullPath} && ${cmd}`;

      const child = childProcess.spawn(cmdString, args, { shell: true, stdio: 'inherit' });

      child.on('close', (code) => {
        if (code === 0) {
          this.actions.push({
            description,
            status: chalk.green("OK")
          });
          resolve(`Child process exited with code ${code}`);
        } else {
          this.actions.push({
            description,
            status: chalk.red("ERR")
          });
          reject(`Child process exited with code ${code}`);
        }
      });
    });
  }

  cpFromTemplate(src: string, dst: string, description: string) {
    const fullDstPath = path.join(this.fullPath, dst);
    fs.cpSync(path.join(__dirname, "templates", src), fullDstPath);
    const fileExists = fs.existsSync(fullDstPath);
    this.actions.push({
      description,
      status: !fileExists ? chalk.red("ERR") : chalk.green("OK")
    })
  }

  cp(src: string, dst: string, description: string) {
    const fullSrcPath = path.join(this.fullPath, src);
    const fullDstPath = path.join(this.fullPath, dst);
    fs.cpSync(fullSrcPath, fullDstPath);
    const fileExists = fs.existsSync(fullDstPath);
    this.actions.push({
      description,
      status: !fileExists ? chalk.red("ERR") : chalk.green("OK")
    })
  }

  rm(filePath: string, description: string) {
    const fullFilePath = path.join(this.fullPath, filePath);
    fs.rmSync(fullFilePath);
    const fileExists = fs.existsSync(fullFilePath);
    this.actions.push({
      description,
      status: fileExists ? chalk.red("ERR") : chalk.green("OK")
    });
  }

  report() {
    console.log("\nSummary:")
    this.actions.forEach((action) => {
      console.log(`[${chalk.bold(action.status)}]\t${action.description}`);
    })
  }
}