package id.animo.ausweissdk

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.nfc.NfcAdapter
import android.nfc.Tag
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class AusweisSdkReactActivityLifecycleListener(private val context: Context) : ReactActivityLifecycleListener {
    /**
    * Handle intents to this application. Mainly for handling NFC intents that can be forwarded to the
    * AusweisSdk
    * @see https://docs.expo.dev/modules/android-lifecycle-listeners/#activity-lifecycle-listeners
    * @see https://www.ausweisapp.bund.de/sdk/android.html#implementation
    */
    override fun onNewIntent(intent: Intent): Boolean {
        val tag: Tag? = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG)
        if (tag != null) {
            return AusweisSdkConnectionHandler.instance.updateNfcTag(tag)
        }

        return false
    }

    override fun onResume(activity: Activity) {
        super.onResume(activity)

        AusweisSdkConnectionHandler.instance.enableDispatcher(activity)
    }

    override fun onPause(activity: Activity) {
        super.onPause(activity)

        AusweisSdkConnectionHandler.instance.disableDispatcher(activity)
    }
}