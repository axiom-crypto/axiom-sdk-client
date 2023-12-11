// const { bin: {  }} = require('../../package.json');
const { exec } = require("child_process");

describe("Run", () => {

  test("Test account", () => {
    exec("pnpm axiom run --help", (err, stdout, stderr) => {
      // error = stderr;
      // result = stdout;
      // let jest know when the process finishes execution
      // so all the tests below will be run with error and 
      // result populated
      console.log(stdout);
    });
  });
});