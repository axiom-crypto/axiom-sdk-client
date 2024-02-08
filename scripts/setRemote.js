const fs = require("fs");
const { execSync } = require("child_process");

const packages = {
  "@axiom-crypto/circuit": {
    path: "../circuit/js",
    version: "",
  },
  "@axiom-crypto/client": {
    path: "../client",
    version: "",
  },
  "@axiom-crypto/harness": {
    path: "../harness",
    version: "",
  },
  "@axiom-crypto/react": {
    path: "../react",
    version: "",
  },
};

let ci = false;
if (process.argv[2] === "ci") {
  ci = true;
}

const packageManager = ci ? "npm" : "pnpm";

const dependencyTypes = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
];

function setRemote() {
  // Get all package versions
  for (const package of Object.keys(packages)) {
    const packageJsonPath = packages[package].path + "/package.json";
    const packageJson = require(packageJsonPath);
    packages[package].version = packageJson.version;
  }

  // Substitute package versions 
  for (const package of Object.keys(packages)) {
    const packageJsonPath = packages[package].path + "/package.json";
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
            packageJson[dependencyType][packageSearchStr] = packages[packageSearchStr].version;
          }
        }
      });
    }
    fs.writeFileSync(packageJsonPath.slice(1), JSON.stringify(packageJson, null, 2));
    execSync(`cd ${packages[package].path.slice(1)} && ${packageManager} i`);
  }

  return packages;
}

exports.setRemote = setRemote;
