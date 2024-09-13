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
      src="https://img.shields.io/badge/License-EUPL%201.2-blue.svg"
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

You can see the available [commands](https://www.ausweisapp.bund.de/sdk/commands.html#) and [messages](https://www.ausweisapp.bund.de/sdk/messages.html), which are typed in the `sendCommand` and `addMessageListener` methods.

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

### Auth Flow

The package also exports an `AusweisAuthFlow` class that wraps the required logic for a general auth flow. An example of how to use the class can be found below.

To use the `AusweisAuthFlow` you need to configure it with the correct callbacks, and then call the `start()` method with the `tcTokenUrl`.

To cancel the flow, you can call the `cancel()` flow on the `AusweisAuthFlow` instance.

The Ausweis SDK only allows one flow to be active concurrently. It is important that you do not create multiple instances of the `AusweisAuthFlow`, as they will both receive the same events and messages, and will cause conflicts.

Note that this class is optimized for a simple auth flow and thus it may not fit all use cases. For example, the `SET_CAN` and `SET_PUK` commands are not supported (in case of too many failed PIN attempts). Attached simulator cards are also not supported. For more advanced use cases you can use the lower level commands and message listeners methods.

```tsx
import { AusweisAuthFlow } from '@animo-id/expo-ausweis-sdk'
import { useState } from 'react'
import { Button, StyleSheet, Text, View } from 'react-native'

export default function App() {
  const [message, setMessage] = useState<string>()
  const [flow, setFlow] = useState<AusweisAuthFlow>()

  const [cardAttachRequested, setCardAttachRequested] = useState(false)
  const [isCardAttached, setIsCardAttached] = useState(false)
  const [progress, setProgress] = useState(0)

  const [requestedAccessRights, setRequestedAccessRights] = useState<string[]>()
  const [onAcceptAccessRights, setOnAcceptAccessRights] = useState<(accept: boolean) => void>()

  const cancelFlow = () =>
    flow
      ?.cancel()
      .then(() => setFlow(undefined))
      .catch((error) => setMessage(`Error canceling flow. ${error.message}`))

  const runAuthFlow = async () => {
    setMessage(undefined)
    setFlow(
      new AusweisAuthFlow({
        debug: true,
        // Can set to true to allow simulator cards. In this case `onEnterPin` and `onAttachCard` won't be called
        allowSimulatorCard: false,
        onEnterPin: ({ attemptsRemaining }) => {
          // Mock incorrect pin entry
          return attemptsRemaining === 1 ? '123456' : '123123'
        },
        onError: ({ message, reason }) => {
          setFlow(undefined)
          setCardAttachRequested(false)
          setProgress(0)
          setMessage(`${reason}: ${message}`)
        },
        onSuccess: () => {
          setFlow(undefined)
          setProgress(100)
          setCardAttachRequested(false)
          setMessage('Successfully ran auth flow')
        },
        onAttachCard: () => {
          // iOS will already show the NFC scanner modal, but on Android we need
          // use this callback to show the NFC scanner modal.
          setCardAttachRequested(true)
        },
        onCardAttachedChanged: ({ isCardAttached }) => setIsCardAttached(isCardAttached),
        onStatusProgress: ({ progress }) => setProgress(progress),
        onRequestAccessRights: ({ effective }) =>
          new Promise((resolve) => {
            setRequestedAccessRights(effective)
            setOnAcceptAccessRights(() => {
              return (accept: boolean) => {
                resolve({ acceptAccessRights: accept })
                setOnAcceptAccessRights(undefined)
                setRequestedAccessRights(undefined)
              }
            })
          }),
      }).start({
        tcTokenUrl: 'https://test.governikus-eid.de/AusweisAuskunft/WebServiceRequesterServlet',
      })
    )
  }

  return (
    <View style={[StyleSheet.absoluteFill, { flex: 1, alignContent: 'center', justifyContent: 'center' }]}>
      <Button onPress={flow ? cancelFlow : runAuthFlow} title={flow ? 'Cancel' : 'Start Auth Flow'} />
      {flow && <Text>Progress: {progress}%</Text>}
      {flow && <Text>Is card attached: {isCardAttached ? 'Yes' : 'No'}</Text>}
      {flow && cardAttachRequested && <Text>Please present your card to the NFC scanner</Text>}
      {flow && requestedAccessRights && (
        <>
          <Text>
            Requested Access Rights:
            {'\n -'}
            {requestedAccessRights.join('\n- ')}
          </Text>
          <Button title="Accept" onPress={() => onAcceptAccessRights?.(true)} />
        </>
      )}
      {message && <Text>{message}</Text>}
    </View>
  )
}
```

## Contributing

Is there something you'd like to fix or add? Great, we love community contributions! To get involved, please follow our [contribution guidelines](./CONTRIBUTING.md).

## License

Expo Ausweis SDK is licensed under the [EUPL Version 1.2](./LICENSE). The AusweisApp SDK used by this Expo Module is also licensed under EUPL Version 1.2
