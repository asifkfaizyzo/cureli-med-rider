// src/components/home/ShopMarker.tsx (do not remove this comment)
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FontFamily } from "../../theme/typography";

interface ShopMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  shopName: string;
  isOpen: boolean;
  onPress?: () => void;
}

export function ShopMarker({
  coordinate,
  shopName,
  isOpen,
  onPress,
}: ShopMarkerProps) {
  const { colors } = useTheme();

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      tracksViewChanges={false} // Performance optimization
    >
      <View style={styles.container}>
        {/* Pin */}
        <View
          style={[
            styles.pin,
            {
              backgroundColor: isOpen ? colors.brand.primary : colors.text.disabled,
            },
          ]}
        >
          <Ionicons
            name="medkit"
            size={16}
            color="#ffffff"
          />
        </View>
        {/* Label */}
        {!isOpen && (
          <View
            style={[
              styles.label,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.border.default,
              },
            ]}
          >
            <Text style={[styles.labelText, { color: colors.status.error }]}>
              Closed
            </Text>
          </View>
        )}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  label: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  labelText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    textTransform: "uppercase",
  },
});