import React from "react";
import { ActivityIndicator, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";

type Props = { style?: ViewStyle; size?: "small" | "large" };

export function LoadingSpinner({ style, size = "large" }: Props) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={colors.brandGreen} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
