import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { APIChatMessage } from "../../types";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";

type Props = { message: APIChatMessage; isMine: boolean };

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function MessageBubble({ message, isMine }: Props) {
  return (
    <View style={[styles.wrapper, isMine ? styles.wrapperRight : styles.wrapperLeft]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.text, isMine ? styles.textMine : styles.textTheirs]}>
          {message.body}
        </Text>
        <Text style={[styles.time, isMine ? styles.timeMine : styles.timeTheirs]}>
          {fmtTime(message.created_at)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 3, paddingHorizontal: 16 },
  wrapperRight: { alignItems: "flex-end" },
  wrapperLeft: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "76%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.xl,
  },
  bubbleMine: {
    backgroundColor: colors.brandGreen,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  text: { fontSize: 15, lineHeight: 22 },
  textMine: { color: "#FFFFFF" },
  textTheirs: { color: colors.text },
  time: { fontSize: 10, marginTop: 4 },
  timeMine: { color: "rgba(255,255,255,0.7)", textAlign: "right" },
  timeTheirs: { color: colors.subtext },
});
