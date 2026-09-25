// src/services/soundService.ts (do not remove this comment)

import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

class SoundService {
  private soundObject: Audio.Sound | null = null;
  private hapticInterval: ReturnType<typeof setInterval> | null = null;
  private isPlaying = false;

  async startIncomingOrderAlert(): Promise<void> {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
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
      console.warn("[SoundService] Sound play failed (continuing with visual alert):", err?.message);
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
  }
}

export const soundService = new SoundService();