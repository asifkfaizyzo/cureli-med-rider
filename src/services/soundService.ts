// src/services/soundService.ts (do not remove this comment)

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as Haptics from "expo-haptics";
import { NativeModules, Platform } from "react-native";

const { FullScreenDeliveryModule } = NativeModules;

class SoundService {
  private soundObject: Audio.Sound | null = null;
  private hapticInterval: ReturnType<typeof setInterval> | null = null;
  private isPlaying = false;

  async startIncomingOrderAlert(): Promise<void> {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // ── Android: Bump system alert/alarm stream volume to MAX ────────
    if (Platform.OS === "android" && FullScreenDeliveryModule) {
      try {
        await FullScreenDeliveryModule.setMaxAlarmVolume();
      } catch (err) {
        console.warn("[SoundService] Failed to override volume:", err);
      }
    }

    try {
      // ── Android: Request alarm-level audio focus ──────────────────────
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      });

      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/incoming_order.mp3"),
        {
          isLooping: true,
          volume: 1.0,
        },
      );

      this.soundObject = sound;
      await this.soundObject.playAsync();
    } catch (err: any) {
      console.warn(
        "[SoundService] Sound play failed (continuing with visual alert):",
        err?.message,
      );
    }

    // Trigger looping haptics
    this.triggerHapticPattern();
    this.hapticInterval = setInterval(() => {
      this.triggerHapticPattern();
    }, 1500);
  }

  private triggerHapticPattern(): void {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Haptics unavailable on emulator / unsupported device
    }
  }

  async stopIncomingOrderAlert(): Promise<void> {
    this.isPlaying = false;

    if (this.hapticInterval) {
      clearInterval(this.hapticInterval);
      this.hapticInterval = null;
    }

    if (this.soundObject) {
      try {
        await this.soundObject.stopAsync();
        await this.soundObject.unloadAsync();
      } catch {
        // Sound already unloaded
      }
      this.soundObject = null;
    }

    // ── Release audio focus ───────────────────────────────────────────
    try {
      await Audio.setAudioModeAsync({
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      });
    } catch {
      // Non-fatal
    }

    // ── Android: Restore the original alarm stream volume level ─────
    if (Platform.OS === "android" && FullScreenDeliveryModule) {
      try {
        await FullScreenDeliveryModule.restoreAlarmVolume();
      } catch (err) {
        console.warn("[SoundService] Failed to restore original stream volume:", err);
      }
    }
  }
}

export const soundService = new SoundService();