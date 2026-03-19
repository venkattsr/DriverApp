// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for Firebase .cjs and .mjs files
config.resolver.sourceExts.push('cjs', 'mjs');

// For Firebase v10 with Expo: occasionally Metro resolves the browser export.
// If using Expo SDK 50+, disabling package exports can force it to use the RN entry.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
