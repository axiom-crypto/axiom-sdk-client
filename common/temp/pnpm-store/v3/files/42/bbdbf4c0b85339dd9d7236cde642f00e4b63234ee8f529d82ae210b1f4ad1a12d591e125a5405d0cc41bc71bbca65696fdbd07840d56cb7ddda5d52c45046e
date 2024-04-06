"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypesLibraryName = exports.getLibraryName = void 0;
const nodeModulesFolderName = 'node_modules/';
const libraryNameRegex = /node_modules\/((?:(?=@)[^/]+\/[^/]+|[^/]+))\//;
function getLibraryName(fileName) {
    const lastNodeModulesIndex = fileName.lastIndexOf(nodeModulesFolderName);
    if (lastNodeModulesIndex === -1) {
        return null;
    }
    const match = libraryNameRegex.exec(fileName.slice(lastNodeModulesIndex));
    if (match === null) {
        return null;
    }
    return match[1];
}
exports.getLibraryName = getLibraryName;
function getTypesLibraryName(path) {
    const libraryName = getLibraryName(path);
    if (libraryName === null) {
        return null;
    }
    const typesFolderPrefix = '@types/';
    if (!libraryName.startsWith(typesFolderPrefix)) {
        return null;
    }
    return libraryName.substring(typesFolderPrefix.length);
}
exports.getTypesLibraryName = getTypesLibraryName;
