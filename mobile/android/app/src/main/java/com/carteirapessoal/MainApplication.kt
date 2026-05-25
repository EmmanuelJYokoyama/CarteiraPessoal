package com.carteirapessoal

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    // Schedule periodic reminders using WorkManager
    try {
      val workManager = androidx.work.WorkManager.getInstance(applicationContext)
      val periodicRequest = androidx.work.PeriodicWorkRequestBuilder<com.carteirapessoal.ReminderWorker>(1, java.util.concurrent.TimeUnit.DAYS)
        .setInitialDelay(15, java.util.concurrent.TimeUnit.MINUTES)
        .build()

      workManager.enqueueUniquePeriodicWork(
        "reminder_work",
        androidx.work.ExistingPeriodicWorkPolicy.KEEP,
        periodicRequest
      )
    } catch (e: Exception) {
      // Fail silently - WorkManager may be unavailable in some test environments
      android.util.Log.e("MainApplication", "Failed to schedule WorkManager job", e)
    }
  }
}
