export type NativeMessageEventPayload = {
  value: string
}

export type MessageEventPayload = {
  msg: string
}

export type CommandPayload = {
  cmd: string
  [key: string]: unknown
}
