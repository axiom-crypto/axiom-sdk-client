// Sets all versions of the packages listed below to the same value
// Pass argument `increment` to increment the version number

const fs = require("fs");

let increment = false;

if (process.argv.length < 3) {
  throw new Error("Please include a version as an argument: `pnpm versions <versionName>`");
}
const setVersion = process.argv[2];
if (setVersion.toLowerCase() === "increment" || setVersion.toLowerCase() === "inc") {
  increment = true;
}

const packages = {
  "@axiom-crypto/circuit": {
    path: "../circuit",
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

console.log("setVersion", setVersion);

function setVersions() {
  // Write package version to all paths
  for (const package of Object.keys(packages)) {
    const packageJsonPath = packages[package].path + "/package.json";
    let packageJson = require(packageJsonPath);
    let packageVersion = packageJson.version;
    if (increment) {
      let versionParts = packageVersion.split(".");
      let patchVer = parseInt(versionParts[versionParts.length-1]);
      patchVer++;
      versionParts[versionParts.length-1] = patchVer.toString();
      packageVersion = versionParts.join(".");
    } else {
      packageVersion = setVersion;
    }
    packageJson.version = packageVersion;
    console.log(`Set ${package} version: ${packageVersion}`);

    fs.writeFileSync(packageJsonPath.slice(1), JSON.stringify(packageJson, null, 2));
  }
}

setVersions();
