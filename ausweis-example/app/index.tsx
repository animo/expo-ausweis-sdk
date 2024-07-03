import { addMessageListener, initializeSdk, sendCommand } from '@animo-id/expo-ausweis-sdk'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

export default function App() {
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
        setIsSdkInitialized(true)
        console.log('error setting up', e)
      })
  }, [])

  // Send command once SDK is initialized
  useEffect(() => {
    if (!isSdkInitialized) return

    sendCommand({ cmd: 'GET_INFO' })
  }, [isSdkInitialized])

  return (
    <View style={[StyleSheet.absoluteFill, { flex: 1, alignContent: 'center', justifyContent: 'center' }]}>
      <Text>Hello</Text>
    </View>
  )
}
