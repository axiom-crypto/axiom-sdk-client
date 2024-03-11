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
    try {
      execSync(
        `rm package-lock.json pnpm-lock.yaml && `,
        { 
          cwd: packages[package].path.slice(1),
          stdio: 'inherit'
        }
      );
    } catch (_e) {}
    execSync(
      `${packageManager} i && ${packageManager} run build`,
      { 
        cwd: packages[package].path.slice(1),
        stdio: 'inherit'
      }
    );
    // execSync(`cd ${packages[package].path.slice(1)}`);
    // try {
    //   execSync(`rm package-lock.json pnpm-lock.yaml`);
    // } catch (_e) {}
    // execSync(`${packageManager} install`);
    // execSync(`${packageManager} run build`);
    // execSync(`cd..`);
  }
}

main();
