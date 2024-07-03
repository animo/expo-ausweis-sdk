import { requireNativeModule } from 'expo-modules-core'
import type { NativeModule } from 'react-native'

interface AusweisSdk extends NativeModule {
  sendCommand: (command: string) => void
  initialize(): Promise<boolean>
}

// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
export default requireNativeModule<AusweisSdk>('AusweisSdk')
