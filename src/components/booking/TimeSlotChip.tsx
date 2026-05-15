import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";

interface Props {
  time: string;
  selected: boolean;
  onPress: () => void;
  available?: boolean;
}

export function TimeSlotChip({ time, selected, onPress, available = true }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!available}
      style={[
        styles.container,
        selected && styles.selectedContainer,
        !available && styles.unavailableContainer,
      ]}
    >
      <Text
        style={[
          styles.text,
          selected && styles.selectedText,
          !available && styles.unavailableText,
        ]}
      >
        {time}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    margin: spacing.xs,
  },
  selectedContainer: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  unavailableContainer: {
    backgroundColor: colors.borderLight,
    borderColor: colors.borderLight,
  },
  text: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
  },
  selectedText: {
    color: "#FFFFFF",
  },
  unavailableText: {
    color: colors.placeholder,
    textDecorationLine: "line-through",
  },
});
