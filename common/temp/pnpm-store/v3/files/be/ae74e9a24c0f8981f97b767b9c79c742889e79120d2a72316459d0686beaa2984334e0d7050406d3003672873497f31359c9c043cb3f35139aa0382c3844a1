"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSchemaMatch = exports.schemaPrimitiveValues = void 0;
exports.schemaPrimitiveValues = {
    boolean: false,
    requiredBoolean: true,
    string: '',
    requiredString: 'REQUIRED',
};
const schemaRequiredValues = new Set([
    exports.schemaPrimitiveValues.requiredBoolean,
    exports.schemaPrimitiveValues.requiredString,
]);
function checkSchemaMatch(value, schema, errors) {
    if (value === undefined) {
        errors.push('Root value is undefined');
        return false;
    }
    return checkSchemaMatchRecursively(value, schema, '', errors);
}
exports.checkSchemaMatch = checkSchemaMatch;
// eslint-disable-next-line complexity
function checkSchemaMatchRecursively(value, schema, prefix, errors) {
    if (typeof schema === 'boolean' || typeof schema === 'string') {
        const schemeType = typeof schema;
        if (value === undefined && schemaRequiredValues.has(schema)) {
            errors.push(`Value for "${prefix}" is required and must have type "${schemeType}"`);
            return false;
        }
        const valueType = typeof value;
        if (value !== undefined && typeof schema !== valueType) {
            errors.push(`Type of values for "${prefix}" is not the same, expected=${schemeType}, actual=${valueType}`);
            return false;
        }
        return true;
    }
    if (value === undefined) {
        return true;
    }
    if (Array.isArray(schema)) {
        if (!Array.isArray(value)) {
            return false;
        }
        let result = true;
        for (let i = 0; i < value.length; ++i) {
            if (!checkSchemaMatchRecursively(value[i], schema[0], `${prefix}[${i}]`, errors)) {
                result = false;
            }
        }
        return result;
    }
    let result = true;
    for (const valueKey of Object.keys(value)) {
        if (schema[valueKey] === undefined) {
            errors.push(`Exceeded property "${valueKey}" found in ${prefix.length === 0 ? 'the root' : prefix}`);
            result = false;
        }
    }
    for (const schemaKey of Object.keys(schema)) {
        const isSubValueSchemeMatched = checkSchemaMatchRecursively(value[schemaKey], schema[schemaKey], prefix.length === 0 ? schemaKey : `${prefix}.${schemaKey}`, errors);
        result = result && isSubValueSchemeMatched;
    }
    return result;
}
