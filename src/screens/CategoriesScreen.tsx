import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SERVICE_CATEGORIES, CATEGORY_ICONS, ServiceCategory } from "../types";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

export function CategoriesScreen() {
  const navigation = useNavigation<Nav>();

  const go = (category: ServiceCategory) => {
    navigation.navigate("CategoryServices", { category });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Categories</Text>
      <Text style={styles.sub}>Browse all service categories</Text>
      <View style={styles.grid}>
        {SERVICE_CATEGORIES.map((cat) => (
          <Pressable key={cat} style={styles.card} onPress={() => go(cat)}>
            <View style={styles.iconBg}>
              <Text style={styles.icon}>{CATEGORY_ICONS[cat]}</Text>
            </View>
            <Text style={styles.label}>{cat}</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: 32 },
  heading: { fontSize: 26, fontWeight: "700", color: colors.text, marginBottom: 4 },
  sub: { fontSize: 14, color: colors.subtext, marginBottom: 28 },
  grid: { gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
  },
  iconBg: {
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: colors.brandGreenLight,
    alignItems: "center", justifyContent: "center",
  },
  icon: { fontSize: 24 },
  label: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.text },
  arrow: { fontSize: 22, color: colors.subtext },
});
