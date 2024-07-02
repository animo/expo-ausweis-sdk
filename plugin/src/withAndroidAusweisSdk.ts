import fs from 'node:fs'
import path from 'node:path'
import { type ConfigPlugin, withAndroidManifest, withDangerousMod, withMainApplication } from '@expo/config-plugins'
import { addAndroidImports } from './util'

/**
 * Update AndroidManifest according to
 * https://www.ausweisapp.bund.de/sdk/android.html#intent-filter-in-androidmanifest-xml
 */
const withAusweisSdkAndroidManifest: ConfigPlugin = (config) =>
  withAndroidManifest(config, (pluginConfig) => {
    const androidManifest = pluginConfig.modResults.manifest

    const application = androidManifest.application?.find(
      (application) => application.$['android:name'] === '.MainApplication'
    )
    if (!application) {
      throw new Error('Unable to update <application /> MainApplication in AndroidManifest.xml as it was not found')
    }

    const activity = application.activity?.find((activity) => activity.$['android:name'] === '.MainActivity')
    if (!activity) {
      throw new Error(
        'Unable to update <activity /> MainActivity in <application /> MainApplication in AndroidManifest.xml as it was not found'
      )
    }

    // Add metadata
    if (!application['meta-data']) {
      application['meta-data'] = []
    }
    const existingMetadata = application['meta-data'].find(
      (item) => item.$?.['android:name'] === 'android.nfc.action.TECH_DISCOVERED'
    )

    if (existingMetadata && existingMetadata?.$['android:resource'] !== '@xml/nfc_tech_filter') {
      throw new Error(
        `Expected resource to be '@xml/nfc_tech_filter', found ${JSON.stringify(existingMetadata)} ${existingMetadata?.$['android:resource']}`
      )
    }
    if (!existingMetadata) {
      application['meta-data'].push({
        $: {
          'android:name': 'android.nfc.action.TECH_DISCOVERED',
          'android:resource': '@xml/nfc_tech_filter',
        },
      })
    }

    if (!activity['intent-filter']) activity['intent-filter'] = []
    const existingIntentFilter = activity['intent-filter'].find((intentFilter) =>
      intentFilter.action?.find((action) => action.$['android:name'] === 'android.nfc.action.TECH_DISCOVERED')
    )
    if (!existingIntentFilter) {
      activity['intent-filter'].push({
        action: [
          {
            $: {
              'android:name': 'android.nfc.action.TECH_DISCOVERED',
            },
          },
        ],
      })
    }

    return pluginConfig
  })

/** Create NFC Technology Filter according to
 * https://www.ausweisapp.bund.de/sdk/android.html#nfc-technology-filter
 */
const withAusweisNfcTechnologyFilter: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    'android',
    async (pluginConfig) => {
      const resDir = path.join(pluginConfig.modRequest.platformProjectRoot, 'app/src/main/res/xml')
      const filePath = path.join(resDir, 'nfc_tech_filter.xml')

      // Ensure the directory exists
      if (!fs.existsSync(resDir)) {
        fs.mkdirSync(resDir, { recursive: true })
      }

      // Write the NFC tech filter file
      fs.writeFileSync(
        filePath,
        `
        <resources xmlns:xliff="urn:oasis:names:tc:xliff:document:1.2">
          <tech-list>
            <tech>android.nfc.tech.IsoDep</tech>
          </tech-list>
        </resources>
      `
      )

      return pluginConfig
    },
  ])

/**
 * Updates the MainApplication to only execute onCreate logic for the main application
 * and not the AusweisSdk application according to
 * https://www.ausweisapp.bund.de/sdk/android.html#initialization-of-the-android-application
 */
const withAusweisSdkMainApplication: ConfigPlugin = (config) => {
  const handleAusweisSdkProcess = 'if (AusweisSdkUtils.isAA2Process(this)) return'

  return withMainApplication(config, (pluginConfig) => {
    if (pluginConfig.modResults.language !== 'kt') {
      throw new Error('Cannot add AusweisSdk main application because the MainApplication file is not Kotlin')
    }

    let content = pluginConfig.modResults.contents

    const imports = ['id.animo.ausweissdk.AusweisSdkUtils']
    content = addAndroidImports(pluginConfig.modResults.language, content, imports)

    // Only add if not already present
    if (content.indexOf(handleAusweisSdkProcess) === -1) {
      const search = /super.onCreate(.*);?/

      content = content.replace(search, `$&\n${handleAusweisSdkProcess}`)
    }

    pluginConfig.modResults.contents = content
    return pluginConfig
  })
}

export const withAndroidAusweisSdk: ConfigPlugin = (config) => {
  let newConfig = withAusweisSdkAndroidManifest(config)
  newConfig = withAusweisNfcTechnologyFilter(config)
  newConfig = withAusweisSdkMainApplication(config)

  return newConfig
}
