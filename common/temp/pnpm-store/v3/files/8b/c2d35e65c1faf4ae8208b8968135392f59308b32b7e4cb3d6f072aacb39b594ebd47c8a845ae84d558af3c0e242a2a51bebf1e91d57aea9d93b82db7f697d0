"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModuleLikeModuleInfo = exports.getReferencedModuleInfo = exports.getFileModuleInfo = void 0;
const path = require("path");
const ts = require("typescript");
const node_modules_1 = require("./helpers/node-modules");
const fix_path_1 = require("./helpers/fix-path");
const typescript_1 = require("./helpers/typescript");
function getFileModuleInfo(fileName, criteria) {
    return getModuleInfoImpl(fileName, fileName, criteria);
}
exports.getFileModuleInfo = getFileModuleInfo;
function getReferencedModuleInfo(moduleDecl, criteria, typeChecker) {
    const referencedModule = (0, typescript_1.resolveReferencedModule)(moduleDecl, typeChecker);
    if (referencedModule === null) {
        return null;
    }
    const moduleFilePath = ts.isSourceFile(referencedModule)
        ? referencedModule.fileName
        : resolveModuleFileName(referencedModule.getSourceFile().fileName, referencedModule.name.text);
    return getFileModuleInfo(moduleFilePath, criteria);
}
exports.getReferencedModuleInfo = getReferencedModuleInfo;
function getModuleLikeModuleInfo(moduleLike, criteria, typeChecker) {
    const resolvedModuleLike = ts.isSourceFile(moduleLike) ? moduleLike : (0, typescript_1.resolveReferencedModule)(moduleLike, typeChecker) ?? moduleLike;
    const fileName = ts.isSourceFile(resolvedModuleLike)
        ? resolvedModuleLike.fileName
        : resolveModuleFileName(resolvedModuleLike.getSourceFile().fileName, resolvedModuleLike.name.text);
    return getFileModuleInfo(fileName, criteria);
}
exports.getModuleLikeModuleInfo = getModuleLikeModuleInfo;
function resolveModuleFileName(currentFileName, moduleName) {
    return moduleName.startsWith('.') ? (0, fix_path_1.fixPath)(path.join(currentFileName, '..', moduleName)) : `node_modules/${moduleName}/`;
}
/**
 * @param currentFilePath Current file path - can be used to override actual path of module (e.g. with `typeRoots`)
 * @param originalFileName Original file name of the module
 * @param criteria Criteria of module info
 */
function getModuleInfoImpl(currentFilePath, originalFileName, criteria) {
    const npmLibraryName = (0, node_modules_1.getLibraryName)(currentFilePath);
    if (npmLibraryName === null) {
        if (criteria.typeRoots !== undefined) {
            for (const root of criteria.typeRoots) {
                const relativePath = (0, fix_path_1.fixPath)(path.relative(root, originalFileName));
                if (!relativePath.startsWith('../')) {
                    // relativePath is path relative to type root
                    // so we should treat it as "library from node_modules/@types/"
                    return getModuleInfoImpl(remapToTypesFromNodeModules(relativePath), originalFileName, criteria);
                }
            }
        }
        return { type: 0 /* ModuleType.ShouldBeInlined */, fileName: originalFileName, isExternal: false };
    }
    const typesLibraryName = (0, node_modules_1.getTypesLibraryName)(currentFilePath);
    if (shouldLibraryBeInlined(npmLibraryName, typesLibraryName, criteria.inlinedLibraries)) {
        return { type: 0 /* ModuleType.ShouldBeInlined */, fileName: originalFileName, isExternal: true };
    }
    if (shouldLibraryBeImported(npmLibraryName, typesLibraryName, criteria.importedLibraries, criteria.allowedTypesLibraries)) {
        return { type: 1 /* ModuleType.ShouldBeImported */, fileName: originalFileName, isExternal: true };
    }
    if (typesLibraryName !== null && isLibraryAllowed(typesLibraryName, criteria.allowedTypesLibraries)) {
        return { type: 2 /* ModuleType.ShouldBeReferencedAsTypes */, fileName: originalFileName, typesLibraryName, isExternal: true };
    }
    return { type: 3 /* ModuleType.ShouldBeUsedForModulesOnly */, fileName: originalFileName, isExternal: true };
}
function shouldLibraryBeInlined(npmLibraryName, typesLibraryName, inlinedLibraries) {
    return isLibraryAllowed(npmLibraryName, inlinedLibraries) || typesLibraryName !== null && isLibraryAllowed(typesLibraryName, inlinedLibraries);
}
function shouldLibraryBeImported(npmLibraryName, typesLibraryName, importedLibraries, allowedTypesLibraries) {
    if (typesLibraryName === null) {
        return isLibraryAllowed(npmLibraryName, importedLibraries);
    }
    // to be imported a library from types shouldn't be allowed to be references as types
    // thus by default we treat all libraries as "should be imported"
    // but if it is a @types library then it should be imported only if it is not marked as "should be referenced as types" explicitly
    if (allowedTypesLibraries === undefined || !isLibraryAllowed(typesLibraryName, allowedTypesLibraries)) {
        return isLibraryAllowed(typesLibraryName, importedLibraries);
    }
    return false;
}
function isLibraryAllowed(libraryName, allowedArray) {
    return allowedArray === undefined || allowedArray.indexOf(libraryName) !== -1;
}
function remapToTypesFromNodeModules(pathRelativeToTypesRoot) {
    return `node_modules/@types/${pathRelativeToTypesRoot}`;
}
