import type { ConfigPlugin } from '@expo/config-plugins'

import fs from 'node:fs/promises'
import path from 'node:path'
import { withDangerousMod } from '@expo/config-plugins'
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

const withIosAusweisSdk: ConfigPlugin = (config) => {
  return withIosAusweisApp2Pod(config)
}

export { withIosAusweisSdk }
