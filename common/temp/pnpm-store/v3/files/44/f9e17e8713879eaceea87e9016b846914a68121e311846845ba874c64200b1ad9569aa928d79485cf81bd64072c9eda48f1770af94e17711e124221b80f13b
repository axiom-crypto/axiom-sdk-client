"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfigFile = void 0;
const path = require("path");
const logger_1 = require("../logger");
const get_absolute_path_1 = require("../helpers/get-absolute-path");
const check_schema_match_1 = require("./check-schema-match");
/**
 * @internal Do not output this function in generated dts for the npm package
 */
function loadConfigFile(configPath) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const possibleConfig = require((0, get_absolute_path_1.getAbsolutePath)(configPath));
    const errors = [];
    if (!(0, check_schema_match_1.checkSchemaMatch)(possibleConfig, configScheme, errors)) {
        (0, logger_1.errorLog)(errors.join('\n'));
        throw new Error('Cannot parse config file');
    }
    if (!Array.isArray(possibleConfig.entries) || possibleConfig.entries.length === 0) {
        throw new Error('No entries found');
    }
    const configFolder = path.dirname(configPath);
    possibleConfig.entries.forEach((entry) => {
        entry.filePath = (0, get_absolute_path_1.getAbsolutePath)(entry.filePath, configFolder);
        if (entry.outFile !== undefined) {
            entry.outFile = (0, get_absolute_path_1.getAbsolutePath)(entry.outFile, configFolder);
        }
    });
    if (possibleConfig.compilationOptions !== undefined && possibleConfig.compilationOptions.preferredConfigPath !== undefined) {
        possibleConfig.compilationOptions.preferredConfigPath = (0, get_absolute_path_1.getAbsolutePath)(possibleConfig.compilationOptions.preferredConfigPath, configFolder);
    }
    return possibleConfig;
}
exports.loadConfigFile = loadConfigFile;
const configScheme = {
    compilationOptions: {
        followSymlinks: check_schema_match_1.schemaPrimitiveValues.boolean,
        preferredConfigPath: check_schema_match_1.schemaPrimitiveValues.string,
    },
    entries: [
        {
            filePath: check_schema_match_1.schemaPrimitiveValues.requiredString,
            outFile: check_schema_match_1.schemaPrimitiveValues.string,
            failOnClass: check_schema_match_1.schemaPrimitiveValues.boolean,
            noCheck: check_schema_match_1.schemaPrimitiveValues.boolean,
            libraries: {
                allowedTypesLibraries: [check_schema_match_1.schemaPrimitiveValues.string],
                importedLibraries: [check_schema_match_1.schemaPrimitiveValues.string],
                inlinedLibraries: [check_schema_match_1.schemaPrimitiveValues.string],
            },
            output: {
                inlineDeclareGlobals: check_schema_match_1.schemaPrimitiveValues.boolean,
                inlineDeclareExternals: check_schema_match_1.schemaPrimitiveValues.boolean,
                sortNodes: check_schema_match_1.schemaPrimitiveValues.boolean,
                umdModuleName: check_schema_match_1.schemaPrimitiveValues.string,
                noBanner: check_schema_match_1.schemaPrimitiveValues.boolean,
                respectPreserveConstEnum: check_schema_match_1.schemaPrimitiveValues.boolean,
                exportReferencedTypes: check_schema_match_1.schemaPrimitiveValues.boolean,
            },
        },
    ],
};
