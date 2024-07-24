import { AusweisAuthFlow } from '@animo-id/expo-ausweis-sdk'
import { useState } from 'react'
import { Button } from 'react-native'
import { StyleSheet, Text, View } from 'react-native'

export default function App() {
  const [message, setMessage] = useState<string>()
  const [flow, setFlow] = useState<AusweisAuthFlow>()

  const cancelFlow = () =>
    flow
      ?.cancel()
      .then(() => setFlow(undefined))
      .catch((error) => setMessage(`Error canceling flow. ${error.message}`))

  const runAuthFlow = async () => {
    setMessage(undefined)
    setFlow(
      new AusweisAuthFlow({
        onEnterPin: ({ attemptsRemaining }) => {
          // Mock incorrect pin entry
          return attemptsRemaining === 1 ? '123456' : '123123'
        },
        onError: ({ message, reason }) => {
          setFlow(undefined)
          setMessage(`${reason}: ${message}`)
        },
        onSuccess: () => {
          setFlow(undefined)
          setMessage('Successfully ran auth flow')
        },
        onInsertCard: () => {
          // For iOS this will show the NFC scanner modal. on Android we need
          // use this callback to show the NFC scanner modal.
          console.log('please insert card')
        },
      }).start({
        tcTokenUrl: 'https://test.governikus-eid.de/AusweisAuskunft/WebServiceRequesterServlet',
      })
    )
  }

  return (
    <View style={[StyleSheet.absoluteFill, { flex: 1, alignContent: 'center', justifyContent: 'center' }]}>
      <Button onPress={flow ? cancelFlow : runAuthFlow} title={flow ? 'Cancel' : 'Start Auth Flow'} />
      {message && <Text>{message}</Text>}
    </View>
  )
}
