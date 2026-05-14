import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth, UserRole } from "../store/authStore";
import { createUser } from "../services/userService";
import { colors } from "../theme/colors";

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
    <View style={styles.container}>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Choose how you want to use Taskero.</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => setRole("customer")}
          style={[styles.card, role === "customer" && styles.cardSelected]}
        >
          <Text style={styles.cardTitle}>Hire Help</Text>
          <Text style={styles.cardText}>Customer</Text>
        </Pressable>
        <Pressable
          onPress={() => setRole("worker")}
          style={[styles.card, role === "worker" && styles.cardSelected]}
        >
          <Text style={styles.cardTitle}>Find Work</Text>
          <Text style={styles.cardText}>Worker</Text>
        </Pressable>
      </View>
      <View style={styles.form}>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First name"
          style={styles.input}
        />
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last name"
          style={styles.input}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          onPress={handleSubmit}
          style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? "Creating..." : "Create account"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.brandGreen,
    backgroundColor: "#ECFDF5",
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  error: {
    color: colors.danger,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.brandGreen,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: colors.subtext,
  },
});
