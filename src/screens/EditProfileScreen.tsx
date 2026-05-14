import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { updateUser, getUserById } from "../services/userService";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { Avatar } from "../components/common/Avatar";
import { colors } from "../theme/colors";
import { spacing, radius } from "../theme/spacing";
import { useAuth } from "../store/authStore";

export function EditProfileScreen() {
  const { user, dbUserId } = useAuth();
  const navigation = useNavigation();

  const { data: dbUser } = useQuery({
    queryKey: ["user-profile", dbUserId],
    queryFn: () => getUserById(dbUserId!),
    enabled: !!dbUserId,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dbUser) {
      setFirstName(dbUser.first_name || "");
      setLastName(dbUser.last_name || "");
      setAddress(dbUser.address || "");
      setCity(dbUser.city || "");
    }
  }, [dbUser]);

  const handleSave = async () => {
    if (!dbUserId) return;
    setLoading(true);
    try {
      await updateUser(dbUserId, {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        address: address || undefined,
        city: city || undefined,
      });
      Alert.alert("Success", "Profile updated successfully");
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Could not update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const displayName = dbUser
    ? `${dbUser.first_name ?? ""} ${dbUser.last_name ?? ""}`.trim() || "User"
    : "User";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Avatar Card */}
          <View style={styles.avatarCard}>
            <View style={styles.avatarWrapper}>
              <Avatar
                uri={dbUser?.avatar_url ?? user?.photoURL}
                name={displayName}
                size={96}
              />
              <TouchableOpacity style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.tapHint}>Tap to change photo</Text>
          </View>

          {/* Personal Info Group */}
          <Text style={styles.sectionLabel}>PERSONAL INFORMATION</Text>
          <View style={styles.groupCard}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.textInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor="#D1D5DB"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.textInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor="#D1D5DB"
              />
            </View>
          </View>

          {/* Location Group */}
          <Text style={styles.sectionLabel}>LOCATION</Text>
          <View style={styles.groupCard}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Street address"
                placeholderTextColor="#D1D5DB"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.textInput}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor="#D1D5DB"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && { opacity: 0.8 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  content: { paddingBottom: 48 },
  avatarCard: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarWrapper: {
    position: "relative",
    borderWidth: 3,
    borderColor: "#F0F0F0",
    borderRadius: 999,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#111",
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginTop: 12,
  },
  tapHint: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },
  sectionLabel: {
    marginHorizontal: 24,
    marginBottom: 10,
    marginTop: 28,
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.8,
  },
  groupCard: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  inputLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#111",
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginLeft: 16,
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 36,
    marginBottom: 48,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});

