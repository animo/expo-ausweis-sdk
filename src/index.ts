import { EventEmitter, NativeModulesProxy, type Subscription } from 'expo-modules-core'

import AusweisSdkModule, { type NativeMessageEventPayload } from './AusweisSdkModule'

import type { AusweisSdkCommand } from './AusweisSdkCommands'
import type { AusweisSdkMessage } from './AusweisSdkMessages'
export type * from './AusweisSdkCommands'
export type * from './AusweisSdkMessages'

export function sendCommand(command: AusweisSdkCommand): void {
  AusweisSdkModule.sendCommand(JSON.stringify(command))
}

export async function initializeSdk() {
  return await AusweisSdkModule.initialize()
}

const emitter = new EventEmitter(AusweisSdkModule ?? NativeModulesProxy.AusweisSdk)
export function addMessageListener(listener: (message: AusweisSdkMessage) => void): Subscription {
  return emitter.addListener<NativeMessageEventPayload>('onMessage', (event) => listener(JSON.parse(event.value)))
}
