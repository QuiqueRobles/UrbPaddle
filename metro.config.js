const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add platform-specific extensions
config.resolver.platforms = ['native', 'web', 'default'];
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

// Handle .mjs files properly
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'mjs');

// Add unstable_allowRequireContext for better module resolution
config.resolver.unstable_allowRequireContext = true;

// Handle problematic packages with specific resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;