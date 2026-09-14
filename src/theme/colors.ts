// src/theme/colors.ts
export interface ColorPalette {
  brand: {
    primary: string;
    secondary: string;
    mid: string;
    light: string;
    soft: string;
    accent: string;
    primaryText: string;
    primaryTextMuted: string;
    primaryTextSubtle: string;
    primaryBadgeBg: string;
    primaryThumbBorder: string;
  };
  background: {
    page: string;
    card: string;
    elevated: string;
    tint: string;
    accent: string;
    input: string;
    trans: string;
  };
  text: {
    primary: string;
    logo: string;
    secondary: string;
    muted: string;
    faint: string;
    disabled: string;
    brand: string;
    inverse: string;
  };
  border: {
    default: string;
    subtle: string;
    brand: string;
    strong: string;
    input: string;
    inputFocused: string;
  };
  status: {
    success: string;
    successBg: string;
    successBorder: string;
    warning: string;
    warningBg: string;
    error: string;
    errorBg: string;
    errorBorder: string;
    info: string;
    infoBg: string;
  };
  overlay: {
    dark: string;
    light: string;
    medium: string;
  };
  tab: {
    active: string;
    inactive: string;
    background: string;
    border: string;
    itemactive: string;
    iteminactive: string;
  };
  transparent: string;
}

// ── Light palette ─────────────────────────────────────────────
export const LightColors: ColorPalette = {
  brand: {
    primary: "#6A20CD",      // Main purple
          // Main purple
    secondary: "#0C97B8",    // Teal
    mid: "#B084EB",          // Mid purple
    light: "#DFC7FF",        // Lightest purple
    soft: "#C6AAEC",         // Soft purple
    accent: "#6A20CD",       // Accent purple
    primaryText: "#ffffff",
    primaryTextMuted: "rgba(255,255,255,0.6)",
    primaryTextSubtle: "rgba(255,255,255,0.15)",
    primaryBadgeBg: "rgba(255,255,255,0.2)",
    primaryThumbBorder: "rgba(255,255,255,0.3)",
  },
  background: {
    page: "#ffffff",         // Changed to white for clean onboarding
    card: "#ffffff",
    elevated: "#ffffff",
    tint: "#F4F0FA",         // Tinted based on primary
    accent: "#DFC7FF",
    input: "#f8fafc",
    trans: "transparent",
  },
  text: {
    primary: "#000000",
    logo: "#131B63",
    secondary: "#374151",
    muted: "#8c8c8c",        // Muted grey for subtitles
    faint: "#d1d1d1",
    disabled: "#e5e5e5",
    brand: "#6A20CD",        // Purple text
    inverse: "#ffffff",
  },
  border: {
    default: "#E5E7EB",      // Light grey borders
    subtle: "#f1f5f9",
    brand: "#C6AAEC",
    strong: "#6A20CD",
    input: "#e2e8f0",
    inputFocused: "#6A20CD",
  },
  status: {
    success: "#22c55e",
    successBg: "#f0fdf4",
    successBorder: "#bbf7d0",
    warning: "#f59e0b",
    warningBg: "#fffbeb",
    error: "#ef4444",
    errorBg: "#fef2f2",
    errorBorder: "#fecaca",
    info: "#0C97B8",
    infoBg: "#e0f6fc",
  },
  overlay: {
    dark: "rgba(0,0,0,0.5)",
    light: "rgba(255,255,255,0.1)",
    medium: "rgba(255,255,255,0.2)",
  },
  tab: {
    active: "#6A20CD",
    inactive: "#8c8c8c",
    background: "#ffffff",
    border: "#E5E7EB",
    itemactive: "#6A20CD",
    iteminactive: "#8c8c8c",
  },
  transparent: "transparent",
};

// ── Dark palette ──────────────────────────────────────────────
export const DarkColors: ColorPalette = {
  brand: {
    primary: "#6A20CD",      // Keep primary button solid purple
    secondary: "#0C97B8",
    mid: "#B084EB",
    light: "#DFC7FF",
    soft: "#C6AAEC",
    accent: "#B084EB",       // Lighter accent for dark mode readability
    primaryText: "#ffffff",
    primaryTextMuted: "rgba(255,255,255,0.6)",
    primaryTextSubtle: "rgba(255,255,255,0.15)",
    primaryBadgeBg: "rgba(255,255,255,0.2)",
    primaryThumbBorder: "rgba(255,255,255,0.25)",
  },
  background: {
    page: "#121212",
    card: "#1E1E1E",
    elevated: "#2C2C2E",
    tint: "#1F1A2A",
    accent: "#2D1D4A",
    input: "#1E1E1E",
    trans: "transparent",
  },
  text: {
    primary: "#ffffff",
    logo: "#38bdf8",
    secondary: "#E5E7EB",
    muted: "#9CA3AF",
    faint: "#4B5563",
    disabled: "#374151",
    brand: "#B084EB",        // High contrast purple text for dark mode
    inverse: "#000000",
  },
  border: {
    default: "#374151",
    subtle: "#1F2937",
    brand: "#4A1A8C",
    strong: "#B084EB",
    input: "#374151",
    inputFocused: "#B084EB",
  },
  status: {
    success: "#4ade80",
    successBg: "#0a2017",
    successBorder: "#166534",
    warning: "#fbbf24",
    warningBg: "#1a1505",
    error: "#f87171",
    errorBg: "#1f0a0a",
    errorBorder: "#7f1d1d",
    info: "#38bdf8",
    infoBg: "#0a1628",
  },
  overlay: {
    dark: "rgba(0,0,0,0.7)",
    light: "rgba(255,255,255,0.05)",
    medium: "rgba(255,255,255,0.1)",
  },
  tab: {
    active: "#B084EB",
    inactive: "#9CA3AF",
    background: "#121212",
    border: "#374151",
    itemactive: "#B084EB",
    iteminactive: "#9CA3AF",
  },
  transparent: "transparent",
};

export const Colors = LightColors;