import React, { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth, UserRole } from "../store/authStore";
import { createUser } from "../services/userService";
import { colors } from "../theme/colors";
import { Input } from "../components/common/Input";

export function CreateAccountScreen() {
  const { user, completeProfile } = useAuth();
  const [role, setRole] = useState<UserRole>("customer");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!user) {
      setError("Please sign in again.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const profile = await createUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone_number: user?.phoneNumber ?? null,
        role,
      });
      await completeProfile(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brandGreen} />
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <View style={styles.iconCircle}>
            <Text style={styles.heroIcon}>🧩</Text>
          </View>
          <Text style={styles.heroTitle}>Create your account</Text>
          <Text style={styles.heroSubtitle}>
            Choose how you'd like to use Taskero
          </Text>
        </View>
      </View>

      <View style={styles.sheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.roleContainer}>
            <Pressable
              onPress={() => setRole("customer")}
              style={[
                styles.roleCard,
                role === "customer" && styles.roleCardSelected,
              ]}
            >
              {role === "customer" && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>✓</Text>
                </View>
              )}
              <Text style={styles.roleEmoji}>🏠</Text>
              <Text style={styles.roleTitle}>Hire Help</Text>
              <Text style={styles.roleDesc}>Get things done</Text>
            </Pressable>

            <Pressable
              onPress={() => setRole("worker")}
              style={[
                styles.roleCard,
                role === "worker" && styles.roleCardSelected,
              ]}
            >
              {role === "worker" && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>✓</Text>
                </View>
              )}
              <Text style={styles.roleEmoji}>🛠️</Text>
              <Text style={styles.roleTitle}>Find Work</Text>
              <Text style={styles.roleDesc}>Earn money</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <Input
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
            />
            <Input
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
            />
            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
              ]}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? "Setting up your account..." : "Continue"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.brandGreen,
  },
  hero: {
    height: "30%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  heroContent: {
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroIcon: {
    fontSize: 32,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    position: "relative",
  },
  roleCardSelected: {
    borderColor: colors.brandGreen,
    backgroundColor: colors.brandGreenLight,
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brandGreen,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    zIndex: 1,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  roleEmoji: {
    fontSize: 24,
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 12,
    color: colors.subtext,
    lineHeight: 16,
  },
  form: {
    gap: 4,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 16,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 12,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
