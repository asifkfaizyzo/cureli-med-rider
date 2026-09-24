import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

interface RecenterButtonProps {
  onPress: () => void;
}

export function RecenterButton({ onPress }: RecenterButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="locate" size={24} color={colors.brand.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: 20, // Above bottom sheet snap point + tab bar
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
});