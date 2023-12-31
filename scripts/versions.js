const fs = require("fs");

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
};

const dependencyTypes = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
];

function versions() {
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
  }

  return packages;
}

exports.versions = versions;
