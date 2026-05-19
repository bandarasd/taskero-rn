import React from "react";
import { View, Text } from "react-native";
import { colors } from "../theme/colors";

export function PlaceholderScreen(title: string) {
  return function Placeholder() {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{title}</Text>
        <Text style={{ fontSize: 14, color: colors.subtext, marginTop: 8 }}>Coming soon</Text>
      </View>
    );
  };
}
