import ExpoModulesCore

import AusweisApp2

var initializationSemaphore = DispatchSemaphore(value: 0)

// Define the callback function
func ausweisSdkCallback(_ pMsg: UnsafePointer<CChar>?) {
    if let msg = pMsg {
        let message = String(cString: msg)
        if (AusweisSdkModule.moduleInstance != nil) {
            AusweisSdkModule.moduleInstance?.sendEvent("onMessage", ["value": message])
        } else {
            print("No module instance registered")
            return
            
        }
        
    } else {
        // SDK is ready to be used
        initializationSemaphore.signal()
    }
}

public class AusweisSdkModule: Module {
    public required init(appContext: ExpoModulesCore.AppContext) {
        super.init(appContext: appContext)
        
        // Set the module instance
        AusweisSdkModule.moduleInstance = self
    }
    
    var isSdkInitialized = false
    static var moduleInstance: AusweisSdkModule?
    
    // Async function to initialize the SDK and wait for it to be ready
    func initializeSdk() async -> Bool {
        return await withCheckedContinuation { continuation in
            let initialized = ausweisapp2_init(ausweisSdkCallback, nil)
            
            if initialized {
                DispatchQueue.global().async {
                    _ = initializationSemaphore.wait(timeout: .now() + 10) // Wait for up to 10 seconds
                    continuation.resume(returning: true)
                    self.isSdkInitialized = true
                }
            } else {
                continuation.resume(returning: false)
            }
        }
    }
    
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('AusweisSdk')` in JavaScript.
    Name("AusweisSdk")

    // Defines event names that the module can send to JavaScript.
    Events("onMessage")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
      Function("sendCommand") { (command: String) in
        if (!isSdkInitialized) {
            throw NSError(domain: "AusweisSdkError", code: 1, userInfo: [NSLocalizedDescriptionKey: "SDK Is not initalized. Make sure to call initialize first."])
        }
        
        ausweisapp2_send(command)
    }

    AsyncFunction("initialize") {
        if isSdkInitialized {
            return true
        }
        
        let isInitialized = await initializeSdk()
        if !isInitialized {
            throw Exception(name: "SdkInitializationError", description: "Unable to initialize SDK")
        }
        return true
    }
  }
}
