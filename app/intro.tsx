import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from "@/src/theme/ThemeContext";
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Deliver Medicines,\nEarn Daily',
    subtitle: 'Join Cureli\'s delivery fleet and start earning from day one. Flexible hours, instant payouts.',
    emoji: '💊',
  },
  {
    title: 'Your Schedule,\nYour Rules',
    subtitle: 'Go online when you want. Accept orders near you. No forced shifts, no penalties.',
    emoji: '🏍️',
  },
  {
    title: 'Grow With\nCureli',
    subtitle: 'Earn bonuses, incentives, and ratings that unlock higher payouts over time.',
    emoji: '📈',
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [current, setCurrent] = useState(0);

  const isLast = current === SLIDES.length - 1;

  function finish() {
    storage.set('has_seen_intro', true);
    router.replace('/(auth)/phone');
  }

  function next() {
    if (isLast) {
      finish();
    } else {
      setCurrent((c) => c + 1);
    }
  }

  const slide = SLIDES[current];

  return (
    <View style={[styles.root, { backgroundColor: colors.background.page }]}>
      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={finish} activeOpacity={0.7}>
        <Text style={[styles.skipText, { color: colors.text.muted }]}>Skip</Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {slide.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.muted }]}>
          {slide.subtitle}
        </Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === current ? colors.brand.primary : colors.border.default,
                width: i === current ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.brand.primary }]}
        onPress={next}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {isLast ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    marginTop: 60,
    padding: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});