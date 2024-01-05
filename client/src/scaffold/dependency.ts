import util from 'util';
import childProcess from 'child_process';
const exec = util.promisify(childProcess.exec);

export const validateForge = async () => {
  try {
    await exec("forge --version");
  } catch (e: any) {
    throw new Error("Requires Foundry. Please install at https://getfoundry.sh/");
  }
}

export const validatePackageManager = (manager: string) => {
  switch(manager) {
    case "npm":
      validateNpm();
      break;
    case "yarn":
      validateYarn();
      break;
    case "pnpm":
      validatePnpm();
      break;
    default:
      throw new Error(`Unsupported package mangaer ${manager}`);
  }
}

export const validateNpm = async () => {
  try {
    await exec("npm --version");
  } catch (e: any) {
    throw new Error("Requires npm. Installation instructions: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm");
  }
}

export const validateYarn = async () => {
  try {
    await exec("yarn --version");
  } catch (e: any) {
    throw new Error("Requires yarn. Installation instructions: https://classic.yarnpkg.com/lang/en/docs/install/");
  }
}

export const validatePnpm = async () => {
  try {
    await exec("pnpm --version");
  } catch (e: any) {
    throw new Error("Requires pnpm. Installation instructions: https://pnpm.io/installation");
  }
}