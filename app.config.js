require("dotenv").config();

// Ensure there is always a valid key string fallback during cloud builds
const GOOGLE_MAPS_KEY =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ||
  "";

module.exports = {
  expo: {
    owner: "your-zeros-and-ones",
    name: "Cureli Rider",
    slug: "cureli-rider",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "cureli-rider",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    android: {
      adaptiveIcon: {
        backgroundColor: "#090025",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.cureli.rider",
      versionCode: 1, // ← BUMP this integer (e.g. 2, 3, 4) for every future build you submit
      googleServicesFile: "./google-services.json",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.WAKE_LOCK",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_LOCATION",
        "android.permission.USE_FULL_SCREEN_INTENT",
        "android.permission.SCHEDULE_EXACT_ALARM",
      ],
      config: {
        googleMaps: {
          apiKey: GOOGLE_MAPS_KEY,
        },
      },
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-dev-client",
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/cureli_rider_logo.png",
          imageWidth: 160,
          resizeMode: "contain",
          backgroundColor: "#090025",
        },
      ],
      "expo-font",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Cureli Rider needs your location for navigation and tracking deliveries.",
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/android-icon-monochrome.png",
          color: "#090025",
          defaultChannel: "cureli-rider-online-service",
          sounds: ["./assets/sounds/incoming_order.mp3"],
        },
      ],
      "./plugins/withRiderNotificationSound",
      "./plugins/withFullScreenDelivery",
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "2.1.20",
            agpVersion: "8.3.2",
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "ae3f3780-a476-4663-8544-4ce6015fd02d",
      },
    },
  },
};
