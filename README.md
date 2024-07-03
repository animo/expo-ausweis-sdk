<p align="center">
  <picture>
   <source media="(prefers-color-scheme: light)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656578320/animo-logo-light-no-text_ok9auy.svg">
   <source media="(prefers-color-scheme: dark)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656578320/animo-logo-dark-no-text_fqqdq9.svg">
   <img alt="Animo Logo" height="200px" />
  </picture>
</p>

<h1 align="center" ><b>Expo - Ausweis SDK</b></h1>

<h4 align="center">Powered by &nbsp; 
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656579715/animo-logo-light-text_cma2yo.svg">
    <source media="(prefers-color-scheme: dark)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656579715/animo-logo-dark-text_uccvqa.svg">
    <img alt="Animo Logo" height="12px" />
  </picture>
</h4><br>

<p align="center">
  <a href="https://typescriptlang.org">
    <img src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg" />
  </a>
  <a href="https://www.npmjs.com/package/@animo-id/expo-ausweis-sdk">
    <img src="https://img.shields.io/npm/v/@animo-id/expo-ausweis-sdk" />
  </a>
  <a
    href="https://raw.githubusercontent.com/animo/expo-ausweis-sdk/main/LICENSE"
    ><img
      alt="License"
      src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"
  /></a>
</p>

<p align="center">
  <a href="#getting-started">Getting started</a> 
  &nbsp;|&nbsp;
  <a href="#contributing">Contributing</a> 
  &nbsp;|&nbsp;
  <a href="#contributing">License</a> 
</p>

---

An [Expo Module](https://docs.expo.dev/modules/overview/) and [Expo Config Plugin](https://docs.expo.dev/guides/config-plugins/) to automatically set up and configure the [Ausweis App SDK](https://www.ausweisapp.bund.de/sdk/intro.html) for iOS & Android in Expo apps.

## Getting Started

Install the plugin and `expo-build-properties` using the following command. We need `expo-build-properties` to set the `minSdkVersion` for Android to at least 26, and enable `useLegacyPackaging` (see [App Bundle](https://www.ausweisapp.bund.de/sdk/android.html#app-bundle) in Ausweis SDK documentation).

```sh
# yarn
yarn add @animo-id/expo-ausweis-sdk expo-build-properties

# npm
npm install @animo-id/expo-ausweis-sdk expo-build-properties

# npm
pnpm install @animo-id/expo-ausweis-sdk expo-build-properties
```

Then add the plugin to your Expo app config (`app.json`, `app.config.json` or `app.config.js`) `plugins` array:

```json
{
  "expo": {
    "plugins": [
      "@animo-id/expo-ausweis-sdk",
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 26,
            "useLegacyPackaging": true
          }
        }
      ]
    ]
  }
}
```

> NOTE: the `expo` top level key is only needed in `app.json`. In `app.config.json`, `app.config.js` and `app.config.ts` the top level expo key is not present anymore.

And lastly, prebuild the application so the Ausweis SDK and Expo Module wrapper can be added as native dependency (If you aren't making any manual modification to the iOS and Android directories you can add them to the gitignore of your project and generate them on demand):

```sh
# yarn
yarn expo prebuild

# npm
npx expo prebuild
```

That's it, you now have Ausweis App SDK configured for your iOS and Android project.

## Usage

You can now import `@animo-id/expo-ausweis-sdk` in your application and use the methods from the SDK. 

```tsx
import { useEffect, useState } from 'react'
import { initializeSdk, sendCommand, addMessageListener } from '@animo-id/expo-ausweis-sdk'


export function App() {
  const [isSdkInitialized, setIsSdkInitialized] = useState(false)

  // Setup listener
  useEffect(
    addMessageListener((message) => {
      console.log('received message', JSON.stringify(message, null, 2))
    }).remove,
    []
  )

  // Initialize SDK
  useEffect(() => {
    initializeSdk()
      .then(() => setIsSdkInitialized(true))
      .catch((e) => {
        console.log('error setting up', e)
      })
  }, [])

  // Send command once SDK is initialized
  useEffect(() => {
    if (!isSdkInitialized) return

    sendCommand({ cmd: 'GET_INFO' })
  }, [isSdkInitialized])

  return null
}
```

## Contributing

Is there something you'd like to fix or add? Great, we love community contributions! To get involved, please follow our [contribution guidelines](./CONTRIBUTING.md).

## License

Expo Ausweis SDK is licensed under the [Apache License Version 2.0 (Apache-2.0)](./LICENSE).
