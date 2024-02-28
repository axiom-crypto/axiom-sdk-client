const { execSync } = require("child_process");
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
    const packageJsonPath = packages[package].path + "/package.json";
    console.log("Processing", packageJsonPath);
    // Install dependencies & build 
    execSync(`cd ${packages[package].path.slice(1)} && ${packageManager} i && ${packageManager} run build && cd ..`);
  }
}

main();
