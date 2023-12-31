const { exec } = require('child_process');
const versions = require('./versions');
const packages = versions.versions();

console.log("--- publishAll ---");
for (const package of Object.keys(packages)) {
  console.log(package);
}


exec('cat *.js bad_file | wc -l', (err, stdout, stderr) => {
  if (err) {
    // node couldn't execute the command
    return;
  }

  // the *entire* stdout and stderr (buffered)
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});