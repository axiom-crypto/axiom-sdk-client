"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageVersion = void 0;
const fs = require("fs");
const path = require("path");
function packageVersion() {
    let dirName = __dirname;
    while (dirName.length !== 0) {
        const packageJsonFilePath = path.join(dirName, 'package.json');
        if (fs.existsSync(packageJsonFilePath)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-var-requires
            return require(packageJsonFilePath).version;
        }
        dirName = path.join(dirName, '..');
    }
    throw new Error(`Cannot find up package.json in ${__dirname}`);
}
exports.packageVersion = packageVersion;
