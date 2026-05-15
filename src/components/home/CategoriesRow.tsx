import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ServiceCategory } from "../../types";
import { spacing } from "../../theme/spacing";

const CATEGORY_CONFIG: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string; bg: string }> = {
  Carpentry:    { label: "Carpentry",    icon: "hammer",          iconColor: "#16A34A", bg: "#DCFCE7" },
  Cleaning:     { label: "Cleaning",     icon: "sparkles",        iconColor: "#16A34A", bg: "#DCFCE7" },
  Painting:     { label: "Painting",     icon: "color-palette",   iconColor: "#16A34A", bg: "#DCFCE7" },
  Electrician:  { label: "Electrician",  icon: "flash",           iconColor: "#16A34A", bg: "#DCFCE7" },
  Moving:       { label: "Moving",        icon: "cube",            iconColor: "#16A34A", bg: "#DCFCE7" },
  Repairing:    { label: "Repairing",    icon: "construct",       iconColor: "#16A34A", bg: "#DCFCE7" },
  Plumbing:     { label: "Plumbing",      icon: "water",           iconColor: "#16A34A", bg: "#DCFCE7" },
  Gardening:    { label: "Gardening",    icon: "leaf",            iconColor: "#16A34A", bg: "#DCFCE7" },
  Laundry:      { label: "Laundry",      icon: "shirt",           iconColor: "#16A34A", bg: "#DCFCE7" },
  Assembly:     { label: "Assembly",     icon: "build",           iconColor: "#16A34A", bg: "#DCFCE7" },
  General:      { label: "General",      icon: "grid",            iconColor: "#16A34A", bg: "#DCFCE7" },
};

const CATEGORIES: ServiceCategory[] = [
  "Carpentry", "Cleaning", "Painting", "Electrician",
  "Moving", "Repairing", "Plumbing", "Gardening",
];

interface CategoriesRowProps {
  onCategoryPress: (category: ServiceCategory) => void;
}

export function CategoriesRow({ onCategoryPress }: CategoriesRowProps) {
  return (
    <View style={styles.container}>
      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const cfg = CATEGORY_CONFIG[item];
          return (
            <Pressable style={styles.categoryItem} onPress={() => onCategoryPress(item)}>
              <View style={[styles.iconBg, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={24} color={cfg.iconColor} />
              </View>
              <Text style={styles.label}>{cfg.label}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: 20,
  },
  categoryItem: {
    alignItems: "center",
    width: 65,
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
});
