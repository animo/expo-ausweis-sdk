import {
  type AusweisSdkAccessRightsMessage,
  type AusweisSdkAuthMessage,
  type AusweisSdkCommand,
  type AusweisSdkEnterPinMessage,
  type AusweisSdkMessage,
  type Subscription,
  addMessageListener,
  initializeSdk,
  sendCommand,
} from './api'

interface OnErrorDetails {
  reason: 'cancelled' | 'user_cancelled' | 'card_locked' | 'unknown' | 'sdk_initialization_failed'
  message: string
  error?: Error
}

interface OnEnterPinOptions {
  failedAttempts: number
  attemptsRemaining: number
}

export interface AusweisAuthFlowOptions {
  /**
   * callback that will be called when the PIN needs to be entered.
   *
   * It will wait for the promise to be resolved, and has no configured timeout.
   * If you need to cancel the flow, you should throw/reject the promise.
   *
   * If the PIN was incorrect, this method will be called again. You can identify this
   * by looking at the `attemptsRemaining` and `failedAttempts` parameters
   */
  onEnterPin: (options: OnEnterPinOptions) => Promise<string> | string

  /**
   * callback that will be called when a card is attached/detached from the NFC scanner.
   */
  onCardAttachedChanged?: (options: { isCardAttached: boolean }) => void

  /**
   * callback that will be called with status updates on the auth flow progress.
   */
  onStatusProgress?: (options: {
    /**
     * number between 0 and 100 indicating the progress of the auth flow
     */
    progress: number
  }) => void

  /**
   * Callback to notify that the card should be attached/placed on the NFC scanner.
   */
  onAttachCard?: () => void

  /**
   * Callback that will be called when the sdk asks for confirmation of access rights.
   * If this callback is not provided, the access rights will be automatically accepted.
   *
   * It will wait for the promise to be resolved, and has no configured timeout.
   * If you need to cancel the flow, you should throw/reject the promise or return false for
   * for `acceptAccessRights`.
   */
  onRequestAccessRights?: (options: {
    /**
     * Current configured access rights to grant, will be used as the access rights if `true` is returned
     * for `acceptAccessRights`.
     */
    effective: string[]

    /**
     * The required access rights. If `acceptAccessRights` is an array and does not contain all access
     * rights from the `required` array, the flow will be cancelled as it's not possible to continue.
     */
    required: string[]

    /**
     * Optional access rights. You can include this in the `acceptAccessRights` array, but it is not required.
     */
    optional: string[]
  }) => Promise<{
    /**
     * Whether to accept the access rights.
     *  - `true` - Accept based on passed `effective` access rights
     *  - `false` - Do not accept (will cancel the auth flow)
     *  - `string[]` - Accept the access rights from the array. Flow will fail if not all
     *      `required` access rights are provided.
     */
    acceptAccessRights: true | false | string[]
  }>

  /**
   * Callback that will be called when the authentication flow succeeded.
   */
  onSuccess: (options: { refreshUrl: string }) => void

  /**
   * Called when an error ocurred in the auth flow that cannot be recovered from.
   *
   * This will be called when:
   *  - The user aborts the auth flow
   *  - An unexpected error occurs
   *  - An action is needed that is not supported by this flow, such as ENTER_CAN or ENTER_PUK
   */
  onError: (details: OnErrorDetails) => void

  /**
   * will enable logging of commands and messages sent/received
   */
  debug?: boolean
}

export interface AusweisAuthFlowStartOptions {
  /**
   * URL to the TcToken
   */
  tcTokenUrl: string
}

export class AusweisAuthFlow {
  private isInProgress = false
  private messageListener?: Subscription
  private sentCommands: Array<AusweisSdkCommand> = []
  private isSdkInitialized = false

  public constructor(private options: AusweisAuthFlowOptions) {}

  public start(startOptions: AusweisAuthFlowStartOptions) {
    this.assertNotInProgress()
    this.isInProgress = true
    this.sentCommands = []

    this.startMessageListener()

    // We handle errors using the onError method
    this.initializeSdk()
      .catch((error) =>
        this.handleError({ reason: 'sdk_initialization_failed', message: 'Error initializing the SDK', error })
      )
      .then(() => this.runAuthCommand(startOptions))
      .catch((error) => this.handleError({ reason: 'unknown', message: 'Error while starting auth flow', error }))

    return this
  }

  /**
   * Cancel the auth flow. Will throw an error if no
   * auth flow is in progress
   */
  public async cancel() {
    this.assertInProgress()
    if (this.isSdkInitialized) {
      this.sendCommand({ cmd: 'CANCEL' })
    }
    this.reset()
    this.options.onError({
      reason: 'cancelled',
      message: "Flow cancelled using 'cancel()' method",
    })
  }

  /**
   * Returns whether an auth flow is currently active.
   */
  public get isActive() {
    return this.isInProgress
  }

  private reset() {
    this.stopMessageListener()
    this.isInProgress = false
    this.sentCommands = []
  }

  private async initializeSdk() {
    if (this.isSdkInitialized) return

    await initializeSdk()
    this.isSdkInitialized = true
  }

  private async handleError(details: OnErrorDetails) {
    if (this.isInProgress) {
      this.sendCommand({ cmd: 'CANCEL' })
      this.reset()
      this.options.onError(details)
    }
  }

  private async handleAuth(message: AusweisSdkAuthMessage) {
    // Auth is also emitted after sending RUN_AUTH command
    if (!message.result) return

    if (message.result.major === 'http://www.bsi.bund.de/ecard/api/1.1/resultmajor#ok') {
      if (!message.url) {
        this.handleError({
          message: "Missing 'url' parameter in successful 'AUTH' message.",
          reason: 'unknown',
        })
        return
      }

      this.reset()
      this.options.onSuccess({
        refreshUrl: message.url,
      })
    } else if (
      message.result.major === 'http://www.bsi.bund.de/ecard/api/1.1/resultmajor#error' &&
      message.result.minor === 'http://www.bsi.bund.de/ecard/api/1.1/resultminor/sal#cancellationByUser'
    ) {
      this.handleError({
        reason: 'user_cancelled',
        message: message.result.message ?? 'User cancelled',
      })
    } else {
      this.handleError({
        reason: 'unknown',
        message: `Unknown error occurred in auth flow. ${message.result.message}`,
      })
    }
  }

  // NOTE: arrow function to have correct binding of this.
  private onMessage = (message: AusweisSdkMessage) => {
    this.debug('Received message from ausweis sdk', JSON.stringify(message, null, 2))

    if (message.msg === 'ACCESS_RIGHTS') {
      this.handleAccessRights(message)
    }

    if (message.msg === 'READER') {
      // If card is empty object the card is unknown, we see that as no card attached for this flow
      const isCardAttached = message.card !== null && Object.keys(message.card).length > 0

      this.options.onCardAttachedChanged?.({
        isCardAttached,
      })
    }

    if (message.msg === 'STATUS' && message.workflow === 'AUTH' && typeof message.progress === 'number') {
      this.options.onStatusProgress?.({
        progress: message.progress,
      })
    }

    if (message.msg === 'INSERT_CARD') {
      this.options.onAttachCard?.()
    }

    if (message.msg === 'ENTER_PIN') {
      this.handleEnterPin(message)
    }

    if (message.msg === 'AUTH') {
      this.handleAuth(message)
    }

    if (message.msg === 'ENTER_CAN' || message.msg === 'ENTER_PUK') {
      this.handleError({
        reason: 'card_locked',
        message: `The card is locked and first needs to be unlocked using the '${message.msg.replace('ENTER_', '')}'. This is not supported by the AusweisAuthFlow. Unblock the card first, before using the AusweisAuthFlow again. This is probably due to too many failed PIN attempts`,
      })
    }
  }

  private async handleAccessRights(message: AusweisSdkAccessRightsMessage) {
    try {
      const { acceptAccessRights } = (await this.options.onRequestAccessRights?.({
        effective: message.chat.effective,
        optional: message.chat.optional,
        required: message.chat.required,
      })) ?? { acceptAccessRights: true }

      if (!acceptAccessRights) {
        return this.handleError({
          reason: 'user_cancelled',
          message: 'Access rights were declined',
        })
      }

      if (Array.isArray(acceptAccessRights)) {
        if (!message.chat.required.every((requiredRight) => acceptAccessRights.includes(requiredRight))) {
          return this.handleError({
            reason: 'user_cancelled',
            message: `Not all access rights were accepted. Required are ${message.chat.required.join(', ')}, accepted are ${acceptAccessRights.join(', ')}`,
          })
        }

        this.sendCommand({
          cmd: 'SET_ACCESS_RIGHTS',
          chat: acceptAccessRights,
        })
      }
      this.sendCommand({
        cmd: 'ACCEPT',
      })
    } catch (error) {
      this.handleError({
        message: 'Error in onRequestAccessRights callback',
        reason: 'unknown',
        error,
      })
    }
  }

  private async handleEnterPin(message: AusweisSdkEnterPinMessage) {
    const retryCounter = message.reader.card?.retryCounter ?? 3

    try {
      // The attempts remaining is weird. The retryCounter when 1 will require the CAN. If it's 0 it requires
      // the PUK. We don't support setting CAN / PUK in this flow so we substract 1 from the retry counter.
      // There is the case however if the user unlocked the card using CAN in e.g. the Ausweis App (not SDK)
      // but hasn't provided a PIN yet. In this case the retryCounter would be 1, and -1 is 0. So we add one.
      // In most cases the
      const attemptsRemaining = Math.max(retryCounter - 1, 1)
      const pin = await this.options.onEnterPin({
        attemptsRemaining,
        // Failed attempts takes over from previous auth sessions if no correct pin was entered (it resets when a correct pin is entered)
        failedAttempts: 3 - retryCounter,
      })
      this.sendCommand({
        cmd: 'SET_PIN',
        value: pin,
      })
    } catch (error) {
      this.handleError({
        message: 'Error in onEnterPin callback',
        reason: 'unknown',
        error,
      })
    }
  }

  private async runAuthCommand(startOptions: AusweisAuthFlowStartOptions) {
    this.sendCommand({
      cmd: 'RUN_AUTH',
      // FIXME:
      developerMode: true,
      // TODO:
      messages: {
        sessionStarted: "Please place your ID card on the top of the device's back side.",
        sessionFailed: 'Scanning process failed.',
        sessionSucceeded: 'Scanning process has been finished successfully.',
        sessionInProgress: 'Scanning process is in progress.',
      },
      tcTokenURL: startOptions.tcTokenUrl,
    })
  }

  private sendCommand(command: AusweisSdkCommand) {
    this.debug('Sending command to ausweis sdk', JSON.stringify(command, null, 2))
    sendCommand(command)
    this.sentCommands.push(command)
  }

  private startMessageListener() {
    if (this.messageListener) return
    this.messageListener = addMessageListener(this.onMessage)
  }

  private stopMessageListener() {
    if (!this.messageListener) return
    this.messageListener.remove()
    this.messageListener = undefined
  }

  private assertNotInProgress() {
    if (this.isInProgress) {
      throw new Error('Auth flow already in progress. Only one auth flow can be active')
    }
  }

  private assertInProgress() {
    if (!this.isInProgress) {
      throw new Error('Auth flow not in progress')
    }
  }

  private debug(...args: unknown[]) {
    if (!this.options.debug) return
    console.log(...args)
  }
}
