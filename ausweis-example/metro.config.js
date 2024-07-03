const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')

const defaultConfig = getDefaultConfig(__dirname)

defaultConfig.watchFolders = [path.resolve(__dirname, '..', 'src')]

defaultConfig.resolver.extraNodeModules = {
  ...defaultConfig.resolver,
  '@animo-id/expo-ausweis-sdk': path.resolve(__dirname, '..', 'src'),
}

defaultConfig.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '..', 'node_modules'),
]

module.exports = defaultConfig
