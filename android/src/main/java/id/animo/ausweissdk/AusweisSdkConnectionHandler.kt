package id.animo.ausweissdk

import android.app.Activity;
import android.nfc.Tag
import android.nfc.NfcAdapter
import android.nfc.tech.IsoDep
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import android.os.RemoteException
import com.governikus.ausweisapp2.IAusweisApp2Sdk
import com.governikus.ausweisapp2.IAusweisApp2SdkCallback

class AusweisSdkConnectionHandler(private val context: Context) {
    private var bound: Boolean = false
    private var sdk: IAusweisApp2Sdk? = null

    private val nfcReaderCallback = NfcAdapter.ReaderCallback { pTag ->
        if (pTag.techList.contains(IsoDep::class.java.name)) {
            updateNfcTag(pTag)
        }
    }

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(className: ComponentName, service: IBinder) {
            try {
                sdk = IAusweisApp2Sdk.Stub.asInterface(service)
                connectToSdk()
            } catch (e: ClassCastException) {
                e.printStackTrace()
            } catch (e: RemoteException) {
                e.printStackTrace()
            }
            bound = true
        }

        override fun onServiceDisconnected(className: ComponentName) {
            sdk = null
            bound = false
        }
    }

    private val callback = object : IAusweisApp2SdkCallback.Stub() {
        var sessionID: String? = null

        override fun sessionIdGenerated(pSessionId: String?, pIsSecureSessionId: Boolean) {
            sessionID = pSessionId
            // Handle session ID generation
        }

        override fun receive(pJson: String?) {
            // Handle message from SDK
        }

        override fun sdkDisconnected() {
            // handle sdk disconnected
        }
    }

    fun bindService() {
        val pkg = context.packageName
        val name = "com.governikus.ausweisapp2.START_SERVICE"
        val serviceIntent = Intent(name).apply {
            setPackage(pkg)
        }
        context.bindService(serviceIntent, connection, Context.BIND_AUTO_CREATE)
    }

    /**
    * Disconnect from SDK according to
    * https://www.ausweisapp.bund.de/sdk/android.html#disconnect-from-sdk
    */
    fun unbindService() {
        if (bound) {
            context.unbindService(connection)
            bound = false
        }
    }

    fun getSessionID(): String? {
        return callback.sessionID
    }

    fun sendCommand(command: String) {
        try {
            val sessionID = getSessionID()
            if (sessionID != null) {
                val success = sdk?.send(sessionID, command) ?: false
                if (!success) {
                    // Handle error: disconnected?
                }
            } else {
                // Handle error: sessionID is null
            }
        } catch (e: RemoteException) {
            e.printStackTrace()
        }
    }

    fun updateNfcTag(tag: Tag): Boolean {
        try {
            val sessionID = getSessionID()
            if (sessionID != null) {
                val success = sdk?.updateNfcTag(sessionID, tag) ?: false
                return success
            } else {
                return false
                // Handle error: sessionID is null
            }
        } catch (e: RemoteException) {
            e.printStackTrace()
            return false
        }
    }

    fun enableDispatcher(activity: Activity) {
        val flags =
            NfcAdapter.FLAG_READER_NFC_A or NfcAdapter.FLAG_READER_NFC_B or NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK

        NfcAdapter.getDefaultAdapter(context)
            ?.enableReaderMode(activity, nfcReaderCallback, flags, null)
    }

    fun disableDispatcher(activity: Activity) {
        NfcAdapter.getDefaultAdapter(context)?.disableReaderMode(activity)
    }

    private fun connectToSdk() {
        try {
            sdk?.let {
                if (!it.connectSdk(callback)) {
                    // Handle error: already connected?
                }
            }
        } catch (e: RemoteException) {
            e.printStackTrace()
        }
    }

    companion object {
        @Volatile
        private var instance: AusweisSdkConnectionHandler? = null

        fun getInstance(context: Context): AusweisSdkConnectionHandler =
            instance ?: synchronized(this) {
                instance ?: AusweisSdkConnectionHandler(context).also { instance = it }
            }
    }
}