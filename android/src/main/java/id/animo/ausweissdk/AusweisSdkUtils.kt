package id.animo.ausweissdk

import android.app.ActivityManager
import android.app.Application
import android.os.Build

class AusweisSdkUtils {
    companion object {
        private const val AA2_PROCESS = "ausweisapp2_service"

        @JvmStatic
        fun isAA2Process(application: Application): Boolean {
            if (Build.VERSION.SDK_INT >= 28) {
                return Application.getProcessName().endsWith(AA2_PROCESS)
            }

            val pid = android.os.Process.myPid()
            val manager = application.getSystemService(Application.ACTIVITY_SERVICE) as ActivityManager
            for (appProcess in manager.runningAppProcesses) {
                if (appProcess.pid == pid) {
                    return appProcess.processName.endsWith(AA2_PROCESS)
                }
            }
            return false
        }
    }
}