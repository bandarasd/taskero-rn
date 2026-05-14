import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../store/authStore";
import { Avatar } from "../components/common/Avatar";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import type { CustomerStackParamList } from "../navigation/stacks/CustomerStack";
import { getCustomerTasks } from "../services/taskService";
import { getUserById } from "../services/userService";

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

export function ProfileScreen() {
  const { user, dbUserId, signOut } = useAuth();
  const navigation = useNavigation<Nav>();

  const { data: dbUser } = useQuery({
    queryKey: ["user-profile", dbUserId],
    queryFn: () => getUserById(dbUserId!),
    enabled: !!dbUserId,
  });

  const { data: tasks } = useQuery({
    queryKey: ["customer-tasks", dbUserId],
    queryFn: () => getCustomerTasks(dbUserId!),
    enabled: !!dbUserId,
  });

  const displayName = dbUser
    ? `${dbUser.first_name ?? ""} ${dbUser.last_name ?? ""}`.trim() || user?.email || "Customer"
    : user?.displayName ?? user?.email ?? "Customer";

  const totalBookings = tasks?.length ?? 0;
  const completedTasks = tasks?.filter((t) => t.status === "completed").length ?? 0;
  const pendingTasks = tasks?.filter((t) => t.status === "pending" || t.status === "active").length ?? 0;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const renderMenuItem = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    onPress: () => void,
    iconColor: string,
    subtitle?: string
  ) => (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + "15" }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 1. Hero Header */}
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Ionicons name="pencil" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.avatarWrapper}>
            <Avatar uri={dbUser?.avatar_url ?? user?.photoURL} name={displayName} size={90} />
          </View>

          <Text style={styles.heroName}>{displayName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>CUSTOMER</Text>
          </View>
        </View>

        {/* 2. Stats Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalBookings}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={[styles.statCard, styles.statDivider]}>
            <Text style={[styles.statValue, { color: colors.brandGreen }]}>
              {completedTasks}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingTasks}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {/* 3. My Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>MY ACTIVITY</Text>
          <View style={styles.menuCard}>
            {renderMenuItem(
              "person-outline",
              "Edit Profile",
              () => navigation.navigate("EditProfile"),
              colors.info
            )}
            <View style={styles.divider} />
            {renderMenuItem(
              "card-outline",
              "Payment Methods",
              () => navigation.navigate("ClientPaymentMethods"),
              "#8B5CF6"
            )}
            <View style={styles.divider} />
            {renderMenuItem(
              "star-outline",
              "My Reviews",
              () => navigation.navigate("MyReviews"),
              colors.warning
            )}
          </View>
        </View>

        {/* 4. Account & Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACCOUNT & SETTINGS</Text>
          <View style={styles.menuCard}>
            {renderMenuItem(
              "notifications-outline",
              "Notifications",
              () => navigation.navigate("ClientNotifications"),
              "#EF4444"
            )}
            <View style={styles.divider} />
            {renderMenuItem(
              "lock-closed-outline",
              "Security",
              () => navigation.navigate("SecuritySettings"),
              "#6B7280"
            )}
          </View>
        </View>

        {/* 5. Support */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SUPPORT</Text>
          <View style={styles.menuCard}>
            {renderMenuItem(
              "help-circle-outline",
              "Help Center",
              () => navigation.navigate("HelpCenter"),
              colors.info
            )}
            <View style={styles.divider} />
            {renderMenuItem(
              "document-text-outline",
              "Privacy Policy",
              () => navigation.navigate("PrivacyPolicy"),
              "#6B7280"
            )}
          </View>
        </View>

        {/* 6. Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* 7. Footer */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Taskero v1.0.2</Text>
          <Text style={styles.footerLinks}>Terms of Service • Privacy Policy</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.brandGreen,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  editButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 20,
  },
  avatarWrapper: {
    padding: 4,
    backgroundColor: "#fff",
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  heroName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginTop: 16,
    letterSpacing: -0.5,
  },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  statsStrip: {
    flexDirection: "row",
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: -25,
    borderRadius: radius.lg,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderLight,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.subtext,
    marginTop: 2,
    fontWeight: "500",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.subtext,
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 1,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 64,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.lg,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerLight,
    gap: 10,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.danger,
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 48,
    gap: 4,
  },
  versionText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.subtext,
  },
  footerLinks: {
    fontSize: 12,
    color: colors.placeholder,
  },
});

