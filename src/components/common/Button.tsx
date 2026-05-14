import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  style,
  fullWidth = true,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#fff" : colors.brandGreen} size="small" />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    flexDirection: "row",
  },
  fullWidth: { alignSelf: "stretch" },
  disabled: { opacity: 0.55 },

  primary: { backgroundColor: colors.brandGreen },
  secondary: { backgroundColor: colors.brandGreenLight },
  outline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.brandGreen },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: "transparent" },

  size_sm: { paddingVertical: 8, paddingHorizontal: 16 },
  size_md: { paddingVertical: 13, paddingHorizontal: 24 },
  size_lg: { paddingVertical: 16, paddingHorizontal: 32 },

  text: { fontWeight: "700" },
  text_primary: { color: "#FFFFFF" },
  text_secondary: { color: colors.brandGreenDark },
  text_outline: { color: colors.brandGreen },
  text_danger: { color: "#FFFFFF" },
  text_ghost: { color: colors.brandGreen },

  textSize_sm: { fontSize: 13 },
  textSize_md: { fontSize: 15 },
  textSize_lg: { fontSize: 17 },
});
