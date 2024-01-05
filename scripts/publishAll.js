const util = require('util');
const exec = util.promisify(require('child_process').exec);
const versions = require('./versions');
const packages = versions.versions();

if (process.argv.length < 2) {
  throw new Error("Please include a tag value as an argument: `pnpm publish-all tagname`");
}
const tag = process.argv[2];

const sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  for (const package of Object.keys(packages)) {
    console.log(packages[package]);

    // Install dependencies
    const { stdout: installStdout, stderr: installStderr, err: installErr } = await exec(`cd ${packages[package].path.slice(1)} && pnpm install && cd ..`);
    if (installErr) {
      // node couldn't execute the command
      console.error(err);
      return;
    }
    console.log(installStdout);
    console.log(installStderr);

    // Build
    const { stdout: buildStdout, stderr: buildStderr, err: buildErr } = await exec(`cd ${packages[package].path.slice(1)} && pnpm build && cd ..`);
    if (buildErr) {
      // node couldn't execute the command
      console.error(err);
      return;
    }
    console.log(buildStdout);
    console.log(buildStderr);

    // Publish
    const { stdout: publishStdout, stderr: publishStderr, err: publishErr } = await exec(`cd ${packages[package].path.slice(1)} && pnpm publish --tag ${tag} --no-git-checks && cd ..`);
    if (publishErr) {
      // node couldn't execute the command
      console.error(err);
      return;
    }
    console.log(publishStdout);
    console.log(publishStderr);

    // Pause for 10 seconds for package sync
    await sleep(10000);
  }
}

main();