import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";

interface Props {
  currentStep: number;
  totalSteps?: number;
  labels?: string[];
}

const DEFAULT_LABELS = ["Notes", "Location", "Date & Time", "Details", "Review"];

export function BookingProgressBar({ currentStep, totalSteps = 5, labels = DEFAULT_LABELS }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          return (
            <React.Fragment key={stepNum}>
              {i > 0 && (
                <View style={[styles.connector, isCompleted && styles.connectorFilled]} />
              )}
              <View style={[styles.dot, isActive && styles.dotActive, isCompleted && styles.dotCompleted]}>
                {isCompleted ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={[styles.dotLabel, isActive && styles.dotLabelActive]}>{stepNum}</Text>
                )}
              </View>
            </React.Fragment>
          );
        })}
      </View>
      <Text style={styles.stepText}>
        Step {currentStep} of {totalSteps} — <Text style={styles.stepName}>{labels[currentStep - 1]}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  track: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
  },
  connectorFilled: {
    backgroundColor: colors.brandGreen,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  dotCompleted: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  dotLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.subtext,
  },
  dotLabelActive: {
    color: "#fff",
  },
  checkmark: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  stepText: {
    fontSize: 12,
    color: colors.subtext,
  },
  stepName: {
    color: colors.brandGreen,
    fontWeight: "600",
  },
});
