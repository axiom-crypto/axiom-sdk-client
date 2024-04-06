"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.
var _a;
let settings;
let allPreferredVersions;
let allowedAlternativeVersions;
let userPnpmfile;
let semver;
// Initialize all external aspects of the pnpmfile shim. When using the shim, settings
// are always expected to be available. Init must be called before running any hook that
// depends on a resource obtained from or related to the settings, and will require modules
// once so they aren't repeatedly required in the hook functions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function init(context) {
    // Sometimes PNPM may provide us a context arg that doesn't fit spec, ex.:
    // https://github.com/pnpm/pnpm/blob/97c64bae4d14a8c8f05803f1d94075ee29c2df2f/packages/get-context/src/index.ts#L134
    // So we need to normalize the context format before we move on
    if (typeof context !== 'object' || Array.isArray(context)) {
        context = {
            log: (message) => { },
            originalContext: context
        };
    }
    if (!settings) {
        // Initialize the settings from file
        if (!context.pnpmfileShimSettings) {
            context.pnpmfileShimSettings = require('./pnpmfileSettings.json');
        }
        settings = context.pnpmfileShimSettings;
    }
    else if (!context.pnpmfileShimSettings) {
        // Reuse the already initialized settings
        context.pnpmfileShimSettings = settings;
    }
    if (!allPreferredVersions && settings.allPreferredVersions) {
        allPreferredVersions = new Map(Object.entries(settings.allPreferredVersions));
    }
    if (!allowedAlternativeVersions && settings.allowedAlternativeVersions) {
        allowedAlternativeVersions = new Map(Object.entries(settings.allowedAlternativeVersions).map(([packageName, versions]) => {
            return [packageName, new Set(versions)];
        }));
    }
    // If a userPnpmfilePath is provided, we expect it to exist
    if (!userPnpmfile && settings.userPnpmfilePath) {
        userPnpmfile = require(settings.userPnpmfilePath);
    }
    // If a semverPath is provided, we expect it to exist
    if (!semver && settings.semverPath) {
        semver = require(settings.semverPath);
    }
    // Return the normalized context
    return context;
}
// Set the preferred versions on the dependency map. If the version on the map is an allowedAlternativeVersion
// then skip it. Otherwise, check to ensure that the common version is a subset of the specified version. If
// it is, then replace the specified version with the preferredVersion
function setPreferredVersions(dependencies) {
    var _a;
    for (const [name, version] of Object.entries(dependencies || {})) {
        const preferredVersion = allPreferredVersions === null || allPreferredVersions === void 0 ? void 0 : allPreferredVersions.get(name);
        if (preferredVersion && !((_a = allowedAlternativeVersions === null || allowedAlternativeVersions === void 0 ? void 0 : allowedAlternativeVersions.get(name)) === null || _a === void 0 ? void 0 : _a.has(version))) {
            let preferredVersionRange;
            let versionRange;
            try {
                preferredVersionRange = new semver.Range(preferredVersion);
                versionRange = new semver.Range(version);
            }
            catch (_b) {
                // Swallow invalid range errors
            }
            if (preferredVersionRange &&
                versionRange &&
                semver.subset(preferredVersionRange, versionRange, { includePrerelease: true })) {
                dependencies[name] = preferredVersion;
            }
        }
    }
}
const pnpmfileShim = {
    hooks: {
        // Call the original pnpmfile (if it exists)
        afterAllResolved: (lockfile, context) => {
            var _a;
            context = init(context);
            return ((_a = userPnpmfile === null || userPnpmfile === void 0 ? void 0 : userPnpmfile.hooks) === null || _a === void 0 ? void 0 : _a.afterAllResolved)
                ? userPnpmfile.hooks.afterAllResolved(lockfile, context)
                : lockfile;
        },
        // Set the preferred versions in the package, then call the original pnpmfile (if it exists)
        readPackage: (pkg, context) => {
            var _a;
            context = init(context);
            setPreferredVersions(pkg.dependencies);
            setPreferredVersions(pkg.devDependencies);
            setPreferredVersions(pkg.optionalDependencies);
            return ((_a = userPnpmfile === null || userPnpmfile === void 0 ? void 0 : userPnpmfile.hooks) === null || _a === void 0 ? void 0 : _a.readPackage) ? userPnpmfile.hooks.readPackage(pkg, context) : pkg;
        },
        // Call the original pnpmfile (if it exists)
        filterLog: (_a = userPnpmfile === null || userPnpmfile === void 0 ? void 0 : userPnpmfile.hooks) === null || _a === void 0 ? void 0 : _a.filterLog
    }
};
module.exports = pnpmfileShim;
//# sourceMappingURL=PnpmfileShim.js.map