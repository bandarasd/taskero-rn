import { StyleSheet } from "react-native";
import { colors } from "./colors";

export const typography = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: "700", color: colors.text, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: "700", color: colors.text, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: "600", color: colors.text, lineHeight: 26 },
  h4: { fontSize: 16, fontWeight: "600", color: colors.text, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: "400", color: colors.text, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400", color: colors.text, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "400", color: colors.subtext, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: "500", color: colors.subtext, lineHeight: 20 },
  buttonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  buttonTextSmall: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  price: { fontSize: 18, fontWeight: "700", color: colors.brandGreen },
});
