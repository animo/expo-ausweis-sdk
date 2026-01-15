import { type ConfigPlugin, createRunOncePlugin, withPlugins } from '@expo/config-plugins'

import { withAndroidAusweisSdk } from './withAndroidAusweisSdk'
import { withIosAusweisSdk } from './withIosAusweisSdk'

export interface AusweisSdkPluginOptions {
  ios?: {
    /**
     * Whether to enable required NFC entitlements for iOS. To use the
     * AusweisSDK, these entitlements are required, so you need to configure
     * the entitlements manually in this case.
     *
     * @default true
     */
    enableEntitlements?: boolean
  }
}

const withAusweisSdk: ConfigPlugin<AusweisSdkPluginOptions | undefined> = (config, options) => {
  return withPlugins(config, [
    (config) => withAndroidAusweisSdk(config, options),
    (config) => withIosAusweisSdk(config, options),
  ])
}

export default createRunOncePlugin(withAusweisSdk, '@animo-id/expo-ausweis-sdk')
