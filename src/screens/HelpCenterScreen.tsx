import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { useFaqs } from "../hooks/useFaqs";

export function HelpCenterScreen() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const { data: faqs = [], isLoading } = useFaqs();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="help-buoy" size={32} color={colors.info} />
        </View>
        <Text style={styles.heading}>Help Center</Text>
        <Text style={styles.sub}>Find answers to commonly asked questions or get in touch with our support team.</Text>
      </View>

      <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.brandGreen} style={{ marginVertical: 24 }} />
      ) : faqs.map((faq, idx) => (
        <Pressable
          key={faq.id}
          style={[styles.card, openIdx === idx && styles.cardOpen]}
          onPress={() => setOpenIdx(openIdx === idx ? null : idx)}
        >
          <View style={styles.row}>
            <Text style={[styles.question, openIdx === idx && styles.questionOpen]}>{faq.title}</Text>
            <Ionicons
              name={openIdx === idx ? "chevron-up" : "chevron-down"}
              size={18}
              color={openIdx === idx ? colors.text : colors.placeholder}
            />
          </View>
          {openIdx === idx && (
            <View style={styles.answerContainer}>
              <Text style={styles.answer}>{faq.body.answer}</Text>
            </View>
          )}
        </Pressable>
      ))}

      <View style={styles.contactCard}>
        <View style={styles.contactIconCircle}>
          <Ionicons name="mail" size={24} color={colors.brandGreen} />
        </View>
        <Text style={styles.contactTitle}>Still need help?</Text>
        <Text style={styles.contactText}>
          Email us at <Text style={styles.emailText}>support@taskero.com</Text> and we'll get back to you within 24 hours.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 60 },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.info + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  sub: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.subtext,
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardOpen: {
    borderColor: colors.info + "30",
    backgroundColor: colors.info + "05",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  question: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginRight: 10,
    lineHeight: 20,
  },
  questionOpen: {
    color: colors.info,
  },
  answerContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  answer: {
    fontSize: 14,
    color: colors.subtext,
    lineHeight: 22,
  },
  contactCard: {
    backgroundColor: colors.brandGreenLight,
    borderRadius: radius.xl,
    padding: 24,
    marginTop: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.brandGreen + "20",
  },
  contactIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: "center",
    lineHeight: 22,
  },
  emailText: {
    color: colors.brandGreen,
    fontWeight: "700",
  },
});

