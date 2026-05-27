package com.carteirapessoal

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class ReminderWorker(appContext: Context, workerParams: WorkerParameters) : CoroutineWorker(appContext, workerParams) {
  companion object {
    const val CHANNEL_ID = "reminder_channel"
    const val CHANNEL_NAME = "Lembretes"
    const val NOTIFICATION_ID = 1001
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_DEFAULT)
      channel.description = "Canal para lembretes periódicos do app"
      val nm = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      nm.createNotificationChannel(channel)
    }
  }

  override suspend fun doWork(): Result {
    try {
      createNotificationChannel()

      val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
        .setContentTitle("Lembrete")
        .setContentText("Verifique suas despesas e sincronize quando necessário.")
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setAutoCancel(true)
        .build()

      val nm = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      nm.notify(NOTIFICATION_ID, notification)

      return Result.success()
    } catch (e: Exception) {
      return Result.retry()
    }
  }
}
