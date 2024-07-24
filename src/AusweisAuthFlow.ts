import {
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
   * Callback to notify that the card should be inserted/placed on the NFC scanner.
   */
  onInsertCard?: () => void

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
    // TODO: should probably let the user handle access rights?
    if (message.msg === 'ACCESS_RIGHTS') {
      this.acceptAccessRights()
    }

    if (message.msg === 'INSERT_CARD') {
      this.options.onInsertCard?.()
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

  private async acceptAccessRights() {
    this.sendCommand({
      cmd: 'ACCEPT',
    })
  }

  private sendCommand(command: AusweisSdkCommand) {
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
}
