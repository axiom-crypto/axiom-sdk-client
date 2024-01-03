const fs = require("fs");

const packages = {
  "@axiom-crypto/circuit": {
    path: "../circuit/js",
    version: "link:../circuit/js/dist",
  },
  "@axiom-crypto/client": {
    path: "../client",
    version: "link:../client/dist",
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

function main() {
  // Substitute package versions 
  for (const package of Object.keys(packages)) {
    const packageJsonPath = packages[package].path + "/package.json";
    console.log("### Test", packageJsonPath);
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
            console.log(package, key, packageJson[dependencyType][packageSearchStr]);
            packageJson[dependencyType][packageSearchStr] = packages[packageSearchStr].version;
          }
        }
      });
    }
    fs.writeFileSync(packageJsonPath.slice(1), JSON.stringify(packageJson, null, 2));
  }
}

main();
