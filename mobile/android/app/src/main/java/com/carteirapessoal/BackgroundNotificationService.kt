package com.carteirapessoal

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class BackgroundNotificationService : HeadlessJsTaskService() {
    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        return intent?.extras?.let {
            HeadlessJsTaskConfig(
                "BackgroundNotification", // Deve ser igual ao nome no AppRegistry.registerHeadlessTask
                Arguments.fromBundle(it),
                5000, // Timeout de 5 segundos
                true // Permite a execução mesmo com o app em primeiro plano
            )
        }
    }
}