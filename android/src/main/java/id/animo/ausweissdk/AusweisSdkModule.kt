package id.animo.ausweissdk

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AusweisSdkModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AusweisSdk")
    Events("onMessage")

    Function("sendCommand") { command: String ->
      
    }

    AsyncFunction("initialize") { value: String ->
      // Send an event to JavaScript.
      sendEvent("onChange", mapOf(
        "value" to value
      ))
    }
  }
}
