package id.animo.ausweissdk

import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.util.Log

class AusweisSdkModule : Module() {
  private var connectionHandler = AusweisSdkConnectionHandler.instance.apply {
    this.registerCallback { receivedValue: String? ->
      Log.i("AusweisSdk", "Received message $receivedValue")

      sendEvent("onMessage", mapOf(
            "value" to receivedValue
      ))
    }
  }

  override fun definition() = ModuleDefinition {
    Name("AusweisSdk")
    Events("onMessage")

    Function("sendCommand") { command: String ->
      if (!connectionHandler.isInitialized) {
        throw IllegalStateException("SDK not initialized. Call initialize before sending commands")
      }

      connectionHandler.sendCommand(command)
    }

    AsyncFunction("initialize") Coroutine { ->
      val context = appContext.reactContext?.applicationContext
        ?: throw IllegalStateException("React application context is not available")

      if (connectionHandler.isInitialized) {
        return@Coroutine
      }

      Log.i("AusweisSdk", "Binding Service")
      connectionHandler.bindService(context)
      return@Coroutine
    }
  }
}
