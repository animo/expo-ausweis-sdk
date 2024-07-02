import type { ConfigPlugin } from '@expo/config-plugins'

import fs from 'node:fs/promises'
import path from 'node:path'
import { withDangerousMod, withEntitlementsPlist, withInfoPlist, withPlugins } from '@expo/config-plugins'
import { type MergeResults, mergeContents } from '@expo/config-plugins/build/utils/generateCode'

// const podSource = `pod 'AusweisApp2', :path => File.join(File.dirname(\`node --print "require.resolve('@animo-id/expo-ausweis-sdk/package.json')"\`), "ios/Specs")`
// We need to include the default pod source. By default it is registered implicitly,
// but if a custom source is specified, you need to specify it explicitly
const podSource = `source 'https://github.com/animo/expo-ausweis-sdk'
source 'https://cdn.cocoapods.org'`

export function addAusweisApp2Pod(src: string): MergeResults {
  return mergeContents({
    tag: '@animo-id/expo-ausweis-sdk',
    src,
    newSrc: podSource,
    anchor: /use_native_modules/,
    offset: 0,
    comment: '#',
  })
}

const withIosAusweisApp2Pod: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const filePath = path.join(config.modRequest.platformProjectRoot, 'Podfile')
      const contents = await fs.readFile(filePath, 'utf-8')
      const results = addAusweisApp2Pod(contents)

      if (!results.didMerge) {
        console.log(
          "ERROR: Cannot add source for AusweisApp2 to the project's ios/Podfile because it's malformed. Please report this with a copy of your project Podfile."
        )
        return config
      }

      await fs.writeFile(filePath, results.contents)
      return config
    },
  ])
}

const NfcReaderSessionFormatsKey = 'com.apple.developer.nfc.readersession.formats'
const NfcReaderSessionIdentifiersKey = 'com.apple.developer.nfc.readersession.iso7816.select-identifiers'

const withIosAusweisEntitlements: ConfigPlugin = (config) => {
  const configWithInfoPlist = withInfoPlist(config, (c) => {
    if (!c.modResults.NFCReaderUsageDescription) {
      c.modResults.NFCReaderUsageDescription = 'NFC is used for authentication using your eID card'
    }

    const nfcReaderSessionIdentifiers = c.modResults[NfcReaderSessionIdentifiersKey]

    if (nfcReaderSessionIdentifiers && !Array.isArray(nfcReaderSessionIdentifiers)) {
      throw new Error(`Expect ${NfcReaderSessionIdentifiersKey} to be an array`)
    }

    if ((nfcReaderSessionIdentifiers as string[])?.includes('TAG')) {
      return c
    }

    if (nfcReaderSessionIdentifiers) {
      c.modResults[NfcReaderSessionIdentifiersKey] = Array.from(
        new Set([...(nfcReaderSessionIdentifiers as string[]), 'E80704007F00070302'])
      )
    } else {
      c.modResults[NfcReaderSessionIdentifiersKey] = ['E80704007F00070302']
    }
    return c
  })

  const configWithEntitlements = withEntitlementsPlist(configWithInfoPlist, (c) => {
    const nfcReaderSessionFormats = c.modResults[NfcReaderSessionFormatsKey]

    if (nfcReaderSessionFormats && !Array.isArray(nfcReaderSessionFormats)) {
      throw new Error(`Expect ${NfcReaderSessionFormatsKey} to be an array`)
    }

    if ((nfcReaderSessionFormats as string[])?.includes('TAG')) {
      return c
    }

    if (nfcReaderSessionFormats) {
      c.modResults[NfcReaderSessionFormatsKey] = Array.from(new Set([...(nfcReaderSessionFormats as string[]), 'TAG']))
    } else {
      c.modResults[NfcReaderSessionFormatsKey] = ['TAG']
    }
    return c
  })

  return configWithEntitlements
}

const withIosAusweisSdk: ConfigPlugin = (config) => {
  return withPlugins(config, [withIosAusweisEntitlements, withIosAusweisApp2Pod])
}

export { withIosAusweisSdk }
