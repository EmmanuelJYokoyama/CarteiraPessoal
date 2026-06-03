package com.carteirapessoal

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.work.Worker
import androidx.work.WorkerParameters

class NotificationWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result {
        // Aciona o serviço Headless JS que definimos no index.js
        val serviceIntent = Intent(applicationContext, BackgroundNotificationService::class.java)
        // Garantimos que extras não sejam nulos para que o getTaskConfig dispare a tarefa JS
        serviceIntent.putExtras(Bundle())
        applicationContext.startService(serviceIntent)
        return Result.success()
    }
}