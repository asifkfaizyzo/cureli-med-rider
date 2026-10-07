// plugins/withRiderNotificationSound.js
//
// Custom Expo Config Plugin
//
// Ensures the incoming_order.mp3 sound file is bundled as a native
// Android resource in res/raw/ during EAS prebuild.
//
// Why a custom plugin?
//   - The expo-notifications plugin's `sounds` array should handle this
//     automatically, but behavior varies across SDK versions.
//   - This plugin is a belt-and-suspenders guarantee that the file
//     ends up in the right place for the notification channel to find it.
//
// How it works:
//   1. Hooks into the Android prebuild step (withAndroid)
//   2. Copies assets/sounds/incoming_order.mp3 → android/app/src/main/res/raw/
//   3. The notification channel references it as "incoming_order" (no extension)

const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withRiderNotificationSound(config) {
  return withDangerousMod(config, [
    "android",
    async (exportedConfig) => {
      const projectRoot = exportedConfig.modRequest.projectRoot;

      // Source: the sound file in the project assets
      const sourcePath = path.join(
        projectRoot,
        "assets",
        "sounds",
        "incoming_order.mp3",
      );

      // Destination: Android native raw resources directory
      const rawDir = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "raw",
      );
      const destPath = path.join(rawDir, "incoming_order.mp3");

      // Verify source file exists
      if (!fs.existsSync(sourcePath)) {
        console.warn(
          "[withRiderNotificationSound] WARNING: Sound file not found at:",
          sourcePath,
        );
        console.warn(
          "[withRiderNotificationSound] The notification will fall back to the default system sound.",
        );
        return exportedConfig;
      }

      // Create the raw/ directory if it doesn't exist
      if (!fs.existsSync(rawDir)) {
        fs.mkdirSync(rawDir, { recursive: true });
        console.log(
          "[withRiderNotificationSound] Created directory:",
          rawDir,
        );
      }

      // Copy the sound file
      fs.copyFileSync(sourcePath, destPath);
      console.log(
        "[withRiderNotificationSound] Copied sound file to:",
        destPath,
      );

      // Verify the copy
      const stats = fs.statSync(destPath);
      console.log(
        `[withRiderNotificationSound] Sound file size: ${(stats.size / 1024).toFixed(1)} KB`,
      );

      return exportedConfig;
    },
  ]);
}

module.exports = withRiderNotificationSound;