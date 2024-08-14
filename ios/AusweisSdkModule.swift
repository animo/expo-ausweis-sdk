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
            // If the SDK is already running it means the app was reloaded, but not the ausweis SDK
            // We shutdown and re-initialize (this should only happen in development)
            let isRunning = ausweisapp2_is_running()
            if isRunning {
                ausweisapp2_shutdown()
            }

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
    Name("AusweisSdk")
    Events("onMessage")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("sendCommand") { (command: String) in
        if (!isSdkInitialized) {
            throw NSError(domain: "AusweisSdkError", code: 1, userInfo: [NSLocalizedDescriptionKey: "SDK Is not initialized. Make sure to call initialize first."])
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
