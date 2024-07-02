import { type ConfigPlugin, createRunOncePlugin, withPlugins } from '@expo/config-plugins'

import { withAndroidAusweisSdk } from './withAndroidAusweisSdk'
import { withIosAusweisSdk } from './withIosAusweisSdk'

const withAusweisSdk: ConfigPlugin = (config) => {
  return withPlugins(config, [withAndroidAusweisSdk, withIosAusweisSdk])
}

export default createRunOncePlugin(withAusweisSdk, '@animo-id/expo-ausweis-sdk')
