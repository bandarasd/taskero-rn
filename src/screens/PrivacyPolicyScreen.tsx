import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Privacy Policy</Text>
      <Text style={styles.updated}>Last updated: January 2025</Text>
      {[
        { title: "Information We Collect", body: "We collect information you provide directly, including your name, email, phone number, and location. We also collect usage data, device information, and transaction data when you use our services." },
        { title: "How We Use Your Information", body: "We use your information to provide, improve, and personalize our services, process transactions, send notifications, and comply with legal obligations." },
        { title: "Information Sharing", body: "We share your information with service workers you book, payment processors, and third-party service providers. We do not sell your personal information to third parties." },
        { title: "Data Security", body: "We implement industry-standard security measures to protect your personal information. All payments are processed via Stripe's secure infrastructure." },
        { title: "Your Rights", body: "You have the right to access, update, or delete your personal information. Contact us at privacy@taskero.com to exercise these rights." },
        { title: "Contact", body: "For privacy-related questions, contact us at privacy@taskero.com or write to Taskero, Inc." },
      ].map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 48 },
  heading: { fontSize: 26, fontWeight: "700", color: colors.text, marginBottom: 4 },
  updated: { fontSize: 12, color: colors.subtext, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 8 },
  sectionBody: { fontSize: 14, color: colors.subtext, lineHeight: 24 },
});
