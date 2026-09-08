import "dotenv/config";

export default {
  expo: {
    owner: "your-zeros-and-ones",
    name: "Cureli Delivery Partner",
    slug: "cureli-rider-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "cureli-rider",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: "in.cureli.delivery",
      buildNumber: "1",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          "Cureli Delivery needs your location for navigation and tracking deliveries.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Cureli Delivery needs your location for navigation and tracking deliveries.",
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#090025",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "in.cureli.delivery",
      versionCode: 1,
      // Uncomment when you download google-services.json for in.cureli.delivery from Firebase:
      // googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      permissions: [
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
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
            "Cureli Delivery needs your location for navigation and tracking deliveries.",
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/android-icon-monochrome.png",
          color: "#090025",
          defaultChannel: "default",
          sounds: [],
        },
      ],
      // ── Pin AGP version for EAS build compatibility ───────────
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
        projectId: "",
      },
    },
  },
};