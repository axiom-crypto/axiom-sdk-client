const fs = require('fs');


const convertDocs = () => {

    const docString = fs.readFileSync('my.d.ts', 'utf8');
    const filteredDocString = docString
        .split('\n')
        .filter(line => !line.trim().startsWith('import'))
        .join('\n')
        .replaceAll("export ", "");
    let docs = JSON.stringify(filteredDocString);

    const jsExport = `"use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.axiomDocs = void 0;
    exports.axiomDocs = ${docs}
    `;
    const dTsExport = `export declare const axiomDocs = ${docs};`;
    fs.writeFileSync('dist/docs.js', jsExport);
    fs.writeFileSync('dist/docs.d.ts', dTsExport);
}

if (require.main === module) {
    convertDocs();
}

module.exports = convertDocs;