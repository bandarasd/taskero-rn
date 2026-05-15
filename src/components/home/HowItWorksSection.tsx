import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing } from "../../theme/spacing";

const STEPS = [
  {
    id: "1",
    title: "Browse",
    desc: "Choose a service",
    icon: "search-outline",
    color: "#16A34A",
  },
  {
    id: "2",
    title: "Book",
    desc: "Pick a time",
    icon: "calendar-outline",
    color: "#1D4ED8",
  },
  {
    id: "3",
    title: "Done",
    desc: "Relax & enjoy",
    icon: "checkmark-circle-outline",
    color: "#EA580C",
  },
];

export function HowItWorksSection() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>How It Works</Text>
      <View style={styles.stepsRow}>
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <View style={styles.stepItem}>
              <View style={[styles.iconBg, { backgroundColor: `${step.color}15` }]}>
                <Ionicons name={step.icon as any} size={24} color={step.color} />
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
            {index < STEPS.length - 1 && (
              <View style={styles.connector}>
                <Ionicons name="chevron-forward" size={16} color="#E5E7EB" />
              </View>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: 32,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 20,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
  },
  connector: {
    paddingHorizontal: 4,
  },
});
