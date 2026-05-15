import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

interface Props {
  currentStep: number;
  totalSteps?: number;
}

export function BookingStepDots({ currentStep, totalSteps = 5 }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        const isPast = step < currentStep;

        return (
          <View
            key={index}
            style={[
              styles.dot,
              isActive && styles.activeDot,
              isPast && styles.pastDot,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 6,
    backgroundColor: "transparent",
  },
  activeDot: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pastDot: {
    backgroundColor: colors.subtext,
    borderColor: colors.subtext,
  },
});
