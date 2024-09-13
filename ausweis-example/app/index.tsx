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
        // Can set to true to allow simulator cards
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
