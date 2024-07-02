import { EventEmitter, NativeModulesProxy, type Subscription } from 'expo-modules-core'

import { ChangeEventPayload } from './AusweisSdk.types'
import AusweisSdkModule from './AusweisSdkModule'

// Get the native constant value.
export const PI = AusweisSdkModule.PI

export function hello(): string {
  return AusweisSdkModule.hello()
}

export async function setValueAsync(value: string) {
  return await AusweisSdkModule.setValueAsync(value)
}

const emitter = new EventEmitter(AusweisSdkModule ?? NativeModulesProxy.AusweisSdk)

export function addChangeListener(listener: (event: ChangeEventPayload) => void): Subscription {
  return emitter.addListener<ChangeEventPayload>('onChange', listener)
}

export { ChangeEventPayload }
