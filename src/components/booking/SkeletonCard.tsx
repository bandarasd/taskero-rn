import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";

interface Props {
  variant?: "worker" | "timeslot" | "summary-row";
  style?: ViewStyle;
}

export function SkeletonCard({ variant = "worker", style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  const renderContent = () => {
    switch (variant) {
      case "worker":
        return (
          <View style={styles.workerContainer}>
            <View style={styles.avatar} />
            <View style={styles.textColumn}>
              <View style={styles.titleLine} />
              <View style={styles.subtitleLine} />
            </View>
          </View>
        );
      case "timeslot":
        return <View style={styles.timeslot} />;
      case "summary-row":
        return (
          <View style={styles.row}>
            <View style={styles.rowLabel} />
            <View style={styles.rowValue} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View style={[{ opacity }, style]}>
      {renderContent()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  workerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.borderLight,
    borderRadius: radius.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.border,
  },
  textColumn: {
    marginLeft: spacing.md,
    flex: 1,
  },
  titleLine: {
    height: 14,
    width: "60%",
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  subtitleLine: {
    height: 12,
    width: "40%",
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  timeslot: {
    height: 48,
    flex: 1,
    backgroundColor: colors.borderLight,
    borderRadius: radius.md,
    margin: spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    height: 14,
    width: "30%",
    backgroundColor: colors.borderLight,
    borderRadius: 4,
  },
  rowValue: {
    height: 14,
    width: "40%",
    backgroundColor: colors.borderLight,
    borderRadius: 4,
  },
});
