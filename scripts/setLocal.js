const { execSync, exec } = require("child_process");
const fs = require("fs");

let ci = false;
if (process.argv[2] === "ci") {
  ci = true;
}

const packageManager = ci ? "npm" : "pnpm";
const localPrefix = ci ? "file:" : "link:";

const packages = {
  "@axiom-crypto/circuit": {
    path: "../circuit",
    version: `${localPrefix}../circuit/dist`,
  },
  "@axiom-crypto/client": {
    path: "../client",
    version: `${localPrefix}../client/dist`,
  },
  "@axiom-crypto/harness": {
    path: "../harness",
    version: `${localPrefix}../harness/dist`,
  },
  "@axiom-crypto/react": {
    path: "../react",
    version: `${localPrefix}../react/dist`,
  },
};

const dependencyTypes = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
];

function main() {
  // Substitute package versions 
  for (const package of Object.keys(packages)) {
    console.log("For", package)
    const packageJsonPath = packages[package].path + "/package.json";
    console.log("Processing", packageJsonPath);
    let packageJson = require(packageJsonPath);

    // Check for existence of each dependencyType
    for (const dependencyType of dependencyTypes) {
      if (!packageJson[dependencyType]) {
        continue;
      }
      // Read each packageJson dependency object
      Object.keys(packageJson[dependencyType]).forEach((key) => {
        // Check available dependencies
        for (const packageSearchStr of Object.keys(packages)) {
          if (package === packageSearchStr) {
            continue;
          }
          if (key === packageSearchStr) {
            console.log(`Found ${key}: Setting local`);
            packageJson[dependencyType][packageSearchStr] = packages[packageSearchStr].version;
          }
        }
      });
    }
    fs.writeFileSync(packageJsonPath.slice(1), JSON.stringify(packageJson, null, 2));

    // Install dependencies & build 
    console.log(`cd ${packages[package].path.slice(1)}`);
    const buf0 = execSync(`cd ${packages[package].path.slice(1)}`);
    console.log(`${packageManager} install, prev: ${buf0}`);
    const buf1 = execSync(`${packageManager} install`);
    console.log(`${packageManager} run build, prev: ${buf1}`);
    const buf2 = execSync(`${packageManager} run build`);
    console.log(`cd.., prev: ${buf2}`);
    execSync(`cd..`);
  }
}

main();
