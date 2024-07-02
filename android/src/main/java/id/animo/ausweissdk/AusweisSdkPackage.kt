package id.animo.ausweissdk

import android.content.Context
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

/**
* Package allows us to hook into react lifecycle events. Mainly used for listening to NFC Intents
* See: AusweisSdkReactActivityLifecycleListener
*/
class AusweisSdkPackage : Package {
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(AusweisSdkReactActivityLifecycleListener(activityContext))
  }
}