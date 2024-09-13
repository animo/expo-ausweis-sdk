export type AusweisSdkCommand =
  | AusweisSdkGetInfoCommand
  | AusweisSdkGetStatusCommand
  | AusweisSdkGetApiLevelCommand
  | AusweisSdkSetApiLevelCommand
  | AusweisSdkGetReaderCommand
  | AusweisSdkGetReaderListCommand
  | AusweisSdkRunAuthCommand
  | AusweisSdkRunChangePinCommand
  | AusweisSdkGetAccessRightsCommand
  | AusweisSdkSetAccessRightsCommand
  | AusweisSdkSetCardCommand
  | AusweisSdkContinueCommand
  | AusweisSdkGetCertificateCommand
  | AusweisSdkCancelCommand
  | AusweisSdkAcceptCommand
  | AusweisSdkInterruptCommand
  | AusweisSdkSetPinCommand
  | AusweisSdkSetNewPinCommand
  | AusweisSdkSetCanCommand
  | AusweisSdkSetPukCommand

interface BaseAusweisSdkCommandPayload {
  cmd: string
}

/**
 * Used to send a custom command. Can take any parameters.
 */
export interface GenericAusweisSdkCommandPayload extends BaseAusweisSdkCommandPayload {
  [key: string]: unknown
}

/**
 * GET_INFO command payload to get information about the current installation of AusweisApp.
 */
export interface AusweisSdkGetInfoCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'GET_INFO'
}

/**
 * GET_STATUS command payload to get information about the current workflow and state of AusweisApp.
 */
export interface AusweisSdkGetStatusCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'GET_STATUS'
}

/**
 * GET_API_LEVEL command payload to get information about the available and current API level.
 */
export interface AusweisSdkGetApiLevelCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'GET_API_LEVEL'
}

/**
 * SET_API_LEVEL command payload to set supported API level of your application.
 */
export interface AusweisSdkSetApiLevelCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'SET_API_LEVEL'
  level: number
}

/**
 * GET_READER command payload to get information about the requested reader.
 */
export interface AusweisSdkGetReaderCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'GET_READER'
  name: string
}

/**
 * GET_READER_LIST command payload to get information about all connected readers.
 */
export interface AusweisSdkGetReaderListCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'GET_READER_LIST'
}

/**
 * RUN_AUTH command payload to start an authentication.
 */
export interface AusweisSdkRunAuthCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'RUN_AUTH'
  tcTokenURL: string
  developerMode?: boolean
  handleInterrupt?: boolean
  status?: boolean
  messages?: {
    sessionStarted?: string
    sessionFailed?: string
    sessionSucceeded?: string
    sessionInProgress?: string
  }
}

/**
 * RUN_CHANGE_PIN command payload to start a change PIN workflow.
 */
export interface AusweisSdkRunChangePinCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'RUN_CHANGE_PIN'
  handleInterrupt?: boolean
  status?: boolean
  messages?: {
    sessionStarted?: string
    sessionFailed?: string
    sessionSucceeded?: string
    sessionInProgress?: string
  }
}

/**
 * GET_ACCESS_RIGHTS command payload to get information about the requested access rights.
 */
export interface AusweisSdkGetAccessRightsCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'GET_ACCESS_RIGHTS'
}

/**
 * SET_ACCESS_RIGHTS command payload to set effective access rights.
 */
export interface AusweisSdkSetAccessRightsCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'SET_ACCESS_RIGHTS'
  chat: string[]
}

/**
 * SET_CARD command payload to insert a virtual card.
 */
export interface AusweisSdkSetCardCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'SET_CARD'
  name: string
  simulator?: {
    files: Array<{ fileId: string; shortFileId: string; content: string }>
    keys: Array<{ id: number; content: string }>
  }
}

/**
 * CONTINUE command payload to continue the workflow after a PAUSE was sent.
 */
export interface AusweisSdkContinueCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'CONTINUE'
}

/**
 * GET_CERTIFICATE command payload to get the certificate of current authentication.
 */
export interface AusweisSdkGetCertificateCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'GET_CERTIFICATE'
}

/**
 * CANCEL command payload to cancel the whole workflow.
 */
export interface AusweisSdkCancelCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'CANCEL'
}

/**
 * ACCEPT command payload to accept the current state.
 */
export interface AusweisSdkAcceptCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'ACCEPT'
}

/**
 * INTERRUPT command payload to interrupt the current system dialog on iOS.
 */
export interface AusweisSdkInterruptCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'INTERRUPT'
}

/**
 * SET_PIN command payload to set the PIN of inserted card.
 *
 * `value` can be omitted in case of simulator card.
 */
export interface AusweisSdkSetPinCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'SET_PIN'
  value?: string
}

/**
 * SET_NEW_PIN command payload to set the new PIN of inserted card.
 */
export interface AusweisSdkSetNewPinCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'SET_NEW_PIN'
  value: string
}

/**
 * SET_CAN command payload to set the CAN of inserted card.
 */
export interface AusweisSdkSetCanCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'SET_CAN'
  value: string
}

/**
 * SET_PUK command payload to set the PUK of inserted card.
 */
export interface AusweisSdkSetPukCommand extends BaseAusweisSdkCommandPayload {
  cmd: 'SET_PUK'
  value: string
}
