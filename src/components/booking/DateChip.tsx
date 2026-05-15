import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { format } from "date-fns";

interface Props {
  date: Date;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function DateChip({ date, selected, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        selected && styles.selectedContainer,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.day, selected && styles.selectedText]}>
        {format(date, "EEE")}
      </Text>
      <Text style={[styles.dateNumber, selected && styles.selectedText]}>
        {format(date, "d")}
      </Text>
      <Text style={[styles.month, selected && styles.selectedText]}>
        {format(date, "MMM")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 65,
    height: 85,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  selectedContainer: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  day: {
    fontSize: 12,
    color: colors.subtext,
    fontWeight: "500",
    marginBottom: 2,
  },
  dateNumber: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "700",
  },
  month: {
    fontSize: 11,
    color: colors.subtext,
    fontWeight: "500",
    marginTop: 2,
  },
  selectedText: {
    color: "#FFFFFF",
  },
  disabled: {
    opacity: 0.4,
  },
});
