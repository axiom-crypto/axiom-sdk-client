const { execSync } = require("child_process");
const fs = require("fs");

let ci = false;
if (process.argv[2] === "--ci") {
  ci = true;
}

const packageManager = ci ? "npm" : "pnpm";
const localPrefix = ci ? "file:" : "link:";

const packages = {
  "@axiom-crypto/circuit": {
    path: "../circuit/js",
    version: `${localPrefix}../circuit/js/dist`,
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
    execSync(`cd ${packages[package].path.slice(1)} && ${packageManager} i && ${packageManager} build && cd ..`);
  }
}

main();
