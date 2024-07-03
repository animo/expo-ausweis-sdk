export type AusweisSdkMessage =
  | AusweisSdkAccessRightsMessage
  | AusweisSdkApiLevelMessage
  | AusweisSdkAuthMessage
  | AusweisSdkBadStateMessage
  | AusweisSdkCertificateMessage
  | AusweisSdkChangePinMessage
  | AusweisSdkEnterCanMessage
  | AusweisSdkEnterPinMessage
  | AusweisSdkEnterNewPinMessage
  | AusweisSdkEnterPukMessage
  | AusweisSdkInfoMessage
  | AusweisSdkInsertCardMessage
  | AusweisSdkInternalErrorMessage
  | AusweisSdkInvalidMessage
  | AusweisSdkReaderMessage
  | AusweisSdkReaderListMessage
  | AusweisSdkStatusMessage
  | AusweisSdkPauseMessage
  | AusweisSdkUnknownCommandMessage

export interface AusweisSdkReader {
  name: string
  insertable: boolean
  attached: boolean
  keypad: boolean
  card:
    | {
        inoperative?: boolean
        deactivated?: boolean
        retryCounter?: number
      }
    | Record<string, never>
    | null
}

interface BaseAusweisSdkMessagePayload {
  msg: string
}

/**
 * Used for generic message
 */
export interface GenericAusweisSdkMessagePayload extends BaseAusweisSdkMessagePayload {
  [key: string]: unknown
}

/**
 * ACCESS_RIGHTS message payload sent by AusweisApp once the authentication is started by RUN_AUTH.
 */
export interface AusweisSdkAccessRightsMessage extends BaseAusweisSdkMessagePayload {
  msg: 'ACCESS_RIGHTS'
  error?: string
  chat: {
    effective: string[]
    optional: string[]
    required: string[]
  }
  transactionInfo?: string
  aux?: {
    ageVerificationDate?: string
    requiredAge?: string
    validityDate?: string
    communityId?: string
  }
}

/**
 * API_LEVEL message payload sent if GET_API_LEVEL or SET_API_LEVEL is called.
 */
export interface AusweisSdkApiLevelMessage extends BaseAusweisSdkMessagePayload {
  msg: 'API_LEVEL'
  error?: string
  available: number[]
  current: number
}

/**
 * AUTH message payload sent by AusweisApp if an authentication is initially started.
 */
export interface AusweisSdkAuthMessage extends BaseAusweisSdkMessagePayload {
  msg: 'AUTH'
  error?: string
  result?: {
    major: string
    minor?: string
    language?: string
    description?: string
    message?: string
    reason?: string
  }
  url?: string
}

/**
 * BAD_STATE message payload indicates that a previous command was sent in an invalid state.
 */
export interface AusweisSdkBadStateMessage extends BaseAusweisSdkMessagePayload {
  msg: 'BAD_STATE'
  error: string
}

/**
 * CERTIFICATE message payload provides information about the used certificate.
 */
export interface AusweisSdkCertificateMessage extends BaseAusweisSdkMessagePayload {
  msg: 'CERTIFICATE'
  description: {
    issuerName: string
    issuerUrl: string
    subjectName: string
    subjectUrl: string
    termsOfUsage: string
    purpose: string
  }
  validity: {
    effectiveDate: string
    expirationDate: string
  }
}

/**
 * CHANGE_PIN message payload sent by AusweisApp if a change PIN workflow is initially started.
 */
export interface AusweisSdkChangePinMessage extends BaseAusweisSdkMessagePayload {
  msg: 'CHANGE_PIN'
  success: boolean
  reason?: string
}

/**
 * ENTER_CAN message payload indicates that a CAN is required to continue workflow.
 */
export interface AusweisSdkEnterCanMessage extends BaseAusweisSdkMessagePayload {
  msg: 'ENTER_CAN'
  error?: string
  reader: AusweisSdkReader
}

/**
 * ENTER_PIN message payload indicates that a PIN is required to continue the workflow.
 */
export interface AusweisSdkEnterPinMessage extends BaseAusweisSdkMessagePayload {
  msg: 'ENTER_PIN'
  error?: string
  reader: AusweisSdkReader
}

/**
 * ENTER_NEW_PIN message payload indicates that a new PIN is required to continue the workflow.
 */
export interface AusweisSdkEnterNewPinMessage extends BaseAusweisSdkMessagePayload {
  msg: 'ENTER_NEW_PIN'
  error?: string
  reader: AusweisSdkReader
}

/**
 * ENTER_PUK message payload indicates that a PUK is required to continue the workflow.
 */
export interface AusweisSdkEnterPukMessage extends BaseAusweisSdkMessagePayload {
  msg: 'ENTER_PUK'
  error?: string
  reader: AusweisSdkReader
}

/**
 * INFO message payload provides information about the AusweisApp.
 */
export interface AusweisSdkInfoMessage extends BaseAusweisSdkMessagePayload {
  msg: 'INFO'
  VersionInfo: {
    Name: string
    'Implementation-Title': string
    'Implementation-Vendor': string
    'Implementation-Version': string
    'Specification-Title': string
    'Specification-Vendor': string
    'Specification-Version': string
  }
}

/**
 * INSERT_CARD message payload indicates that the AusweisApp requires a card to continue.
 */
export interface AusweisSdkInsertCardMessage extends BaseAusweisSdkMessagePayload {
  msg: 'INSERT_CARD'
  error?: string
}

/**
 * INTERNAL_ERROR message payload indicates an internal error.
 */
export interface AusweisSdkInternalErrorMessage extends BaseAusweisSdkMessagePayload {
  msg: 'INTERNAL_ERROR'
  error?: string
}

/**
 * INVALID message payload indicates a broken JSON message.
 */
export interface AusweisSdkInvalidMessage extends BaseAusweisSdkMessagePayload {
  msg: 'INVALID'
  error: string
}

/**
 * READER message payload provides information about a connected or disconnected card reader.
 */
export interface AusweisSdkReaderMessage extends BaseAusweisSdkMessagePayload, AusweisSdkReader {
  msg: 'READER'
}

/**
 * READER_LIST message payload provides information about all connected card readers.
 */
export interface AusweisSdkReaderListMessage extends BaseAusweisSdkMessagePayload {
  msg: 'READER_LIST'
  readers: Array<AusweisSdkReader>
}

/**
 * STATUS message payload provides information about the current workflow and state.
 */
export interface AusweisSdkStatusMessage extends BaseAusweisSdkMessagePayload {
  msg: 'STATUS'
  workflow?: string
  progress?: number
  state?: string
}

/**
 * PAUSE message payload indicates certain waiting conditions.
 */
export interface AusweisSdkPauseMessage extends BaseAusweisSdkMessagePayload {
  msg: 'PAUSE'
  cause: string
}

/**
 * UNKNOWN_COMMAND message payload indicates that the command type is unknown.
 */
export interface AusweisSdkUnknownCommandMessage extends BaseAusweisSdkMessagePayload {
  msg: 'UNKNOWN_COMMAND'
  error: string
}
