import React from "react";
import { StyleSheet, View, SafeAreaView } from "react-native";
import { Button } from "../common/Button";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

interface Props {
  label: string;
  price?: string | number;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function StickyPriceCTA({ label, price, onPress, disabled, loading }: Props) {
  const displayLabel = price ? `${label} • Rs ${price}` : label;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["bottom"]}>
        <View style={styles.content}>
          <Button
            label={displayLabel}
            onPress={onPress}
            disabled={disabled}
            loading={loading}
            size="lg"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
