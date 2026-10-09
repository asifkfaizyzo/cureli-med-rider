// plugins/withFullScreenDelivery.js (do not remove this comment)

const { withDangerousMod, withAndroidManifest } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withFullScreenDelivery(config) {
  // ── 1. Modify AndroidManifest.xml ─────────────────────────────────────────
  config = withAndroidManifest(config, async (exportedConfig) => {
    let androidManifest = exportedConfig.modResults;
    let manifest = androidManifest.manifest;
    let application = manifest.application[0];

    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    const permissions = [
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.WAKE_LOCK",
      "android.permission.USE_FULL_SCREEN_INTENT",
      "android.permission.DISABLE_KEYGUARD",
    ];

    permissions.forEach((perm) => {
      const exists = manifest["uses-permission"].some(
        (p) => p.$["android:name"] === perm
      );
      if (!exists) {
        manifest["uses-permission"].push({
          $: { "android:name": perm },
        });
      }
    });

    // Register Full-Screen Lockscreen Activity
    if (!application.activity) application.activity = [];
    const hasActivity = application.activity.some(
      (a) => a.$["android:name"] === "com.cureli.rider.FullScreenDeliveryActivity"
    );

    if (!hasActivity) {
      application.activity.push({
        $: {
          "android:name": "com.cureli.rider.FullScreenDeliveryActivity",
          "android:exported": "true",
          "android:showWhenLocked": "true",
          "android:turnScreenOn": "true",
          "android:launchMode": "singleInstance",
          "android:theme": "@style/Theme.AppCompat.NoActionBar",
          "android:screenOrientation": "portrait"
        }
      });
    }

    // Register Custom FCM Messaging Service
    if (!application.service) application.service = [];
    const hasService = application.service.some(
      (s) => s.$["android:name"] === "com.cureli.rider.DeliveryFCMService"
    );

    if (!hasService) {
      application.service = application.service.filter(
        (s) => !s.$["android:name"].includes("FirebaseListenerService") && 
               !s.$["android:name"].includes("ExpoFirebaseMessagingService")
      );

      application.service.push({
        $: {
          "android:name": "com.cureli.rider.DeliveryFCMService",
          "android:exported": "false"
        },
        "intent-filter": [
          {
            action: [
              { $: { "android:name": "com.google.firebase.MESSAGING_EVENT" } }
            ]
          }
        ]
      });
    }

    return exportedConfig;
  });

  // ── 2. Inject Native Kotlin files & Register Package in MainApplication.kt ─
  config = withDangerousMod(config, [
    "android",
    async (exportedConfig) => {
      const projectRoot = exportedConfig.modRequest.projectRoot;
      const packagePath = "com/cureli/rider";
      const javaDir = path.join(
        projectRoot,
        "android/app/src/main/java",
        packagePath
      );

      fs.mkdirSync(javaDir, { recursive: true });

      // Code for FullScreenDeliveryModule.kt
      const moduleCode = `package com.cureli.rider

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FullScreenDeliveryModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var originalAlarmVolume: Int = -1

    override fun getName(): String = "FullScreenDeliveryModule"

    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        try {
            val granted = Settings.canDrawOverlays(reactContext)
            promise.resolve(granted)
        } catch (e: Exception) {
            promise.reject("ERROR_CHECKING_PERMISSION", e.message)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + reactContext.packageName)
            )
            val activity = reactContext.currentActivity
            if (activity != null) {
                activity.startActivity(intent)
            } else {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactContext.startActivity(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            try {
                val fallbackIntent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactContext.startActivity(fallbackIntent)
                promise.resolve(true)
            } catch (e2: Exception) {
                promise.reject("ERROR_LAUNCHING_SETTINGS", e2.message)
            }
        }
    }

    @ReactMethod
    fun setMaxAlarmVolume(promise: Promise) {
        try {
            val audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            if (originalAlarmVolume == -1) {
                originalAlarmVolume = audioManager.getStreamVolume(AudioManager.STREAM_ALARM)
            }
            val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, 0)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_VOLUME_OVERRIDE", e.message)
        }
    }

    @ReactMethod
    fun restoreAlarmVolume(promise: Promise) {
        try {
            if (originalAlarmVolume != -1) {
                val audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM, originalAlarmVolume, 0)
                originalAlarmVolume = -1
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_VOLUME_RESTORE", e.message)
        }
    }
}`;

      // Code for FullScreenDeliveryPackage.kt
      const packageCode = `package com.cureli.rider

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class FullScreenDeliveryPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(FullScreenDeliveryModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}`;

      // Code for FullScreenDeliveryActivity.kt
      const activityCode = `package com.cureli.rider

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.graphics.Color
import android.view.Gravity

class FullScreenDeliveryActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            keyguardManager.requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            )
        }

        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#090025"))
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
            )
        }

        val titleView = TextView(this).apply {
            text = "🛵 NEW DELIVERY REQUEST"
            setTextColor(Color.WHITE)
            setTextSize(20f)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 30)
        }

        val loadingSpinner = ProgressBar(this, null, android.R.attr.progressBarStyleLarge)

        rootLayout.addView(titleView)
        rootLayout.addView(loadingSpinner)
        setContentView(rootLayout)

        val mainIntent = Intent().apply {
            setClassName(this@FullScreenDeliveryActivity, "com.cureli.rider.MainActivity")
            action = Intent.ACTION_MAIN
            addCategory(Intent.CATEGORY_LAUNCHER)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            intent.extras?.let { putExtras(it) }
        }

        startActivity(mainIntent)
        finish()
    }
}`;

      // Code for DeliveryFCMService.kt
      const serviceCode = `package com.cureli.rider

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class DeliveryFCMService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        try {
            val expoClass = Class.forName("expo.modules.notifications.service.ExpoFirebaseMessagingService")
            val intent = Intent(this, expoClass).apply {
                action = "com.google.firebase.MESSAGING_EVENT"
                putExtra("token", token)
            }
            startService(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val data = remoteMessage.data

        if (data.containsKey("screen") && data["screen"].toString() == "incoming_delivery") {
            val deliveryId = data["delivery_id"] ?: ""
            val orderNumber = data["order_number"] ?: ""
            val shopName = data["shop_name"] ?: "Pharmacy"

            triggerFullScreenIntent(deliveryId, orderNumber, shopName)
            return
        }

        try {
            val expoClass = Class.forName("expo.modules.notifications.service.ExpoFirebaseMessagingService")
            val delegateIntent = Intent(this, expoClass).apply {
                action = "com.google.firebase.MESSAGING_EVENT"
                putExtras(remoteMessage.toIntent())
            }
            startService(delegateIntent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun triggerFullScreenIntent(deliveryId: String, orderNumber: String, shopName: String) {
        val notificationManager = this.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "incoming_delivery"

        val soundUri = Uri.parse("android.resource://" + this.packageName + "/raw/incoming_order")

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Incoming Delivery Requests",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Critical alerts for new delivery assignments. Cannot be silenced."
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 500)
                setSound(
                    soundUri,
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .build()
                )
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
                setBypassDnd(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val fullScreenIntent = Intent(this@DeliveryFCMService, FullScreenDeliveryActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_USER_ACTION
            putExtra("delivery_id", deliveryId)
            putExtra("order_number", orderNumber)
            putExtra("shop_name", shopName)
            putExtra("screen", "incoming_delivery")
        }

        val flag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            @Suppress("DEPRECATION")
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            this@DeliveryFCMService,
            deliveryId.hashCode(),
            fullScreenIntent,
            flag
        )

        val iconResId = applicationContext.resources.getIdentifier("notification_icon", "drawable", this.packageName)
        val resolvedIcon = if (iconResId != 0) iconResId else android.R.drawable.ic_dialog_info

        val notificationBuilder = NotificationCompat.Builder(this@DeliveryFCMService, channelId)
            .setSmallIcon(resolvedIcon)
            .setContentTitle("🛵 New Delivery Request")
            .setContentText("Order #$orderNumber from $shopName")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(false)
            .setOngoing(true)
            .setSound(soundUri)
            .setVibrate(longArrayOf(0, 500, 200, 500, 200, 500))
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)

        notificationManager.notify(deliveryId.hashCode(), notificationBuilder.build())
    }
}`;

      // Write Kotlin files
      fs.writeFileSync(path.join(javaDir, "FullScreenDeliveryModule.kt"), moduleCode);
      fs.writeFileSync(path.join(javaDir, "FullScreenDeliveryPackage.kt"), packageCode);
      fs.writeFileSync(path.join(javaDir, "FullScreenDeliveryActivity.kt"), activityCode);
      fs.writeFileSync(path.join(javaDir, "DeliveryFCMService.kt"), serviceCode);

      // ── 3. Register Package inside MainApplication.kt ─────────────────────
      const mainAppFile = path.join(javaDir, "MainApplication.kt");
      if (fs.existsSync(mainAppFile)) {
        let mainAppContent = fs.readFileSync(mainAppFile, "utf8");

        if (!mainAppContent.includes("FullScreenDeliveryPackage()")) {
          if (mainAppContent.includes("PackageList(this).packages.apply {")) {
            mainAppContent = mainAppContent.replace(
              "PackageList(this).packages.apply {",
              "PackageList(this).packages.apply {\n              add(FullScreenDeliveryPackage())"
            );
          } else if (mainAppContent.includes("PackageList(this).packages")) {
            mainAppContent = mainAppContent.replace(
              "PackageList(this).packages",
              "PackageList(this).packages.apply {\n              add(FullScreenDeliveryPackage())\n            }"
            );
          }
          fs.writeFileSync(mainAppFile, mainAppContent, "utf8");
          console.log("[FullScreenDeliveryPlugin] Registered FullScreenDeliveryPackage in MainApplication.kt");
        }
      }

      // ── 4. Inject FCM Dependencies inside build.gradle ─────────────────────
      const gradleFile = path.join(projectRoot, "android/app/build.gradle");
      if (fs.existsSync(gradleFile)) {
        let content = fs.readFileSync(gradleFile, "utf8");
        if (!content.includes("com.google.firebase:firebase-messaging")) {
          content = content.replace(
            /dependencies\s*\{/,
            `dependencies {\n    implementation("com.google.firebase:firebase-messaging")`
          );
          fs.writeFileSync(gradleFile, content, "utf8");
          console.log("[FullScreenDeliveryPlugin] Injected Firebase-Messaging dependency into build.gradle");
        }
      }

      return exportedConfig;
    },
  ]);

  return config;
}

module.exports = withFullScreenDelivery;