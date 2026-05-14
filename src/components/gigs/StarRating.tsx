import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";

type Props = {
  value: number;
  maxStars?: number;
  size?: number;
  onChange?: (value: number) => void;
  style?: ViewStyle;
};

export function StarRating({ value, maxStars = 5, size = 16, onChange, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: maxStars }, (_, i) => {
        const filled = i < Math.round(value);
        return (
          <Pressable key={i} onPress={onChange ? () => onChange(i + 1) : undefined}>
            <Text style={{ fontSize: size, color: filled ? "#F59E0B" : "#D1D5DB" }}>★</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 2 },
});
