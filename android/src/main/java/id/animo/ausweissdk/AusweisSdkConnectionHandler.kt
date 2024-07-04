package id.animo.ausweissdk

import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.withTimeout
import android.app.Activity;
import android.nfc.Tag
import android.nfc.NfcAdapter
import android.nfc.tech.IsoDep
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import com.governikus.ausweisapp2.IAusweisApp2Sdk
import com.governikus.ausweisapp2.IAusweisApp2SdkCallback
import java.lang.Exception
import java.util.concurrent.CancellationException

class AusweisSdkConnectionHandler() {
    private var sdk: IAusweisApp2Sdk? = null
    private var receiveMessageCallback: ((String?) -> Unit)? = null
    private var initializationComplete = CompletableDeferred<Unit>()

    val isInitialized: Boolean
        get() = sdk != null && getSessionID() != null

    private val nfcReaderCallback = NfcAdapter.ReaderCallback { pTag ->
        if (pTag.techList.contains(IsoDep::class.java.name)) {
            updateNfcTag(pTag)
        }
    }

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(className: ComponentName, service: IBinder) {
            val _sdk = IAusweisApp2Sdk.Stub.asInterface(service)
            val success = _sdk.connectSdk(callback)
            if (!success) {
                throw Exception("Error connecting to SDK. Possibly because the SDK is already initialized")
            }

            initializationComplete.complete(Unit)
            sdk = _sdk
        }

        override fun onServiceDisconnected(className: ComponentName) {
            sdk = null
        }
    }

    private val callback = object : IAusweisApp2SdkCallback.Stub() {
        var sessionID: String? = null

        override fun sessionIdGenerated(pSessionId: String?, pIsSecureSessionId: Boolean) {
            sessionID = pSessionId
        }

        override fun receive(pJson: String?) {
            receiveMessageCallback?.let { it(pJson) }
        }

        override fun sdkDisconnected() {
            sessionID = null
        }
    }

    suspend fun bindService(context: Context) {
        if (sdk != null) {
            throw Exception("Cannot bind service if already bound. Call unbindService first")
        }

        initializationComplete.cancel(CancellationException("Binding started"))
        initializationComplete = CompletableDeferred()

        val pkg = context.packageName
        val name = "com.governikus.ausweisapp2.START_SERVICE"
        val serviceIntent = Intent(name).apply {
            setPackage(pkg)
        }

        context.bindService(serviceIntent, connection, Context.BIND_AUTO_CREATE)

        // Wait for initialization to complete with timeout
        withTimeout(10000L) {
            initializationComplete.await()
        }
    }

    fun registerCallback(callbackHandler: (String?) -> Unit) {
        this.receiveMessageCallback = callbackHandler
    }

    /**
    * Disconnect from SDK according to
    * https://www.ausweisapp.bund.de/sdk/android.html#disconnect-from-sdk
    */
    fun unbindService(context: Context) {
        if (sdk != null) {
            context.unbindService(connection)
        }
    }

    private fun getSessionID(): String? {
        return callback.sessionID
    }

    fun sendCommand(command: String) {
        val sessionID = getSessionID() ?: throw Exception("No open session")
        val sdk = sdk ?: throw Exception("No SDK defined")

        val success = sdk.send(sessionID, command)
        if (!success) {
            throw Exception("Error sending command to SDK")
        }
    }

    fun updateNfcTag(tag: Tag): Boolean {
        // if no session is active, we will return false, as we can't handle the tag
        val sessionID = getSessionID() ?: return false
        val sdk = sdk ?: throw Exception("No SDK defined. Unable to handle tag")

        val success = sdk.updateNfcTag(sessionID, tag)
        return success
    }

    fun enableDispatcher(activity: Activity) {
        // Flags needed as defined in
        // https://www.ausweisapp.bund.de/sdk/android.html#dispatching-nfc-tags-in-foreground
        val flags =
            NfcAdapter.FLAG_READER_NFC_A or NfcAdapter.FLAG_READER_NFC_B or NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK

        NfcAdapter.getDefaultAdapter(activity.baseContext)
            ?.enableReaderMode(activity, nfcReaderCallback, flags, null)
    }

    fun disableDispatcher(activity: Activity) {
        NfcAdapter.getDefaultAdapter(activity.baseContext)?.disableReaderMode(activity)
    }

    companion object {
        @Volatile
        var instance = AusweisSdkConnectionHandler()
    }
}