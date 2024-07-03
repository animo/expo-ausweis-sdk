import { EventEmitter, NativeModulesProxy, type Subscription } from 'expo-modules-core'

import type { CommandPayload, MessageEventPayload, NativeMessageEventPayload } from './AusweisSdk.types'
import AusweisSdkModule from './AusweisSdkModule'

export function sendCommand(command: CommandPayload): void {
  AusweisSdkModule.sendCommand(JSON.stringify(command))
}

export async function initializeSdk() {
  return await AusweisSdkModule.initialize()
}

const emitter = new EventEmitter(AusweisSdkModule ?? NativeModulesProxy.AusweisSdk)
export function addMessageListener(listener: (message: MessageEventPayload) => void): Subscription {
  return emitter.addListener<NativeMessageEventPayload>('onMessage', (event) => listener(JSON.parse(event.value)))
}

export type { MessageEventPayload, CommandPayload }
