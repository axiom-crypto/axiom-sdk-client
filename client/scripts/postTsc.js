// Functions that are to be run after the typescript compiler runs

const fs = require("fs");
const packageJson = require("../package.json");

// Copies a modified version of package.json to the /dist folder
function copyPackageJson() {
  let packageJsonCopy = { ...packageJson };
  delete packageJsonCopy.scripts;
  delete packageJsonCopy.devDependencies;
  delete packageJsonCopy.publishConfig;
  packageJsonCopy.bin = {
    'axiom': './cli/index.js',
  };
  fs.writeFileSync('./dist/package.json', JSON.stringify(packageJsonCopy, null, 2));
  const indexJs = fs.readFileSync("./dist/cli/index.js", 'utf8');
  const withHashBang = `#!/usr/bin/env node\n${indexJs}`;
  fs.writeFileSync('./dist/cli/index.js', withHashBang);
}

function copyReadme() {
  fs.copyFileSync("./README.md", "./dist/README.md");
}

function copyTemplates() {
  const src = "./src/scaffold/templates";
  const dest = "./dist/scaffold/templates";
  fs.mkdirSync(dest);
  fs.cpSync(src, dest, { recursive: true });
}

copyPackageJson();
copyReadme();
copyTemplates();