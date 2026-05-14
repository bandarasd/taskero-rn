import React from "react";
import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";

type Props = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: ViewStyle;
};

export function Avatar({ uri, name, size = 44, style }: Props) {
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const circleStyle = { width: size, height: size, borderRadius: size / 2 };
  const fontSize = size * 0.38;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, circleStyle as ImageStyle, style as ImageStyle]}
      />
    );
  }

  return (
    <View style={[styles.placeholder, circleStyle, style]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { resizeMode: "cover" },
  placeholder: {
    backgroundColor: colors.brandGreenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontWeight: "700", color: colors.brandGreen },
});
