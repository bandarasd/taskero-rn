import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { useCategories } from "../hooks/useCategories";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

export function CategoriesScreen() {
  const navigation = useNavigation<Nav>();
  const { data: categories = [], isLoading } = useCategories();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Categories</Text>
      <Text style={styles.sub}>Browse all service categories</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.brandGreen} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.grid}>
          {categories.map((cat) => (
            <Pressable key={cat.name} style={styles.card} onPress={() => navigation.navigate("CategoryServices", { category: cat.name })}>
              <View style={styles.iconBg}>
                <Text style={styles.icon}>{cat.icon}</Text>
              </View>
              <Text style={styles.label}>{cat.name}</Text>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>
      )}
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
