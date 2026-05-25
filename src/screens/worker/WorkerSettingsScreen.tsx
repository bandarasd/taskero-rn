import React, { useEffect, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../store/authStore";
import { colors } from "../../theme/colors";
import { radius, spacing } from "../../theme/spacing";
import { getSchedule, updateGracePeriod } from "../../services/scheduleService";

const GRACE_OPTIONS = [15, 30, 45, 60];

type SettingRowProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
};

function SettingRow({ icon, label, value, onPress, destructive }: SettingRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? "#EF4444" : colors.brandGreen}
        />
      </View>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
        {label}
      </Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress && !destructive ? (
        <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
      ) : null}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export function WorkerSettingsScreen() {
  const { user, dbUserId, signOut } = useAuth();
  const [gracePeriod, setGracePeriod] = useState<number>(30);

  useEffect(() => {
    if (!dbUserId) return;
    getSchedule(dbUserId)
      .then((schedule) => {
        const first = schedule.find((e) => e.buffer_minutes != null);
        if (first?.buffer_minutes != null) setGracePeriod(first.buffer_minutes);
      })
      .catch(() => {});
  }, [dbUserId]);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const handleGracePeriod = () => {
    if (!dbUserId) return;

    const options = GRACE_OPTIONS.map((m) => `${m} min`);

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Grace Period Between Tasks",
          options: [...options, "Cancel"],
          cancelButtonIndex: options.length,
        },
        (index) => {
          if (index < GRACE_OPTIONS.length) {
            const chosen = GRACE_OPTIONS[index];
            setGracePeriod(chosen);
            updateGracePeriod(dbUserId, chosen).catch(() =>
              Alert.alert("Error", "Could not save grace period.")
            );
          }
        }
      );
    } else {
      Alert.alert(
        "Grace Period Between Tasks",
        "Select buffer time after each task:",
        [
          ...GRACE_OPTIONS.map((m) => ({
            text: `${m} min`,
            onPress: () => {
              setGracePeriod(m);
              updateGracePeriod(dbUserId, m).catch(() =>
                Alert.alert("Error", "Could not save grace period.")
              );
            },
          })),
          { text: "Cancel", style: "cancel" },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="Account" />
      <View style={styles.section}>
        <SettingRow
          icon="person-outline"
          label="Phone"
          value={user?.phoneNumber ?? "—"}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="mail-outline"
          label="Email"
          value={user?.email ?? "—"}
        />
      </View>

      <SectionHeader title="Scheduling" />
      <View style={styles.section}>
        <SettingRow
          icon="time-outline"
          label="Grace Period Between Tasks"
          value={`${gracePeriod} min`}
          onPress={handleGracePeriod}
        />
      </View>

      <SectionHeader title="Notifications" />
      <View style={styles.section}>
        <SettingRow
          icon="notifications-outline"
          label="Push Notifications"
          value="Enabled"
        />
        <View style={styles.divider} />
        <SettingRow
          icon="chatbubble-outline"
          label="New Messages"
          value="Enabled"
        />
        <View style={styles.divider} />
        <SettingRow
          icon="briefcase-outline"
          label="New Booking Requests"
          value="Enabled"
        />
      </View>

      <SectionHeader title="Support" />
      <View style={styles.section}>
        <SettingRow icon="help-circle-outline" label="Help & FAQ" />
        <View style={styles.divider} />
        <SettingRow icon="document-text-outline" label="Terms of Service" />
        <View style={styles.divider} />
        <SettingRow icon="shield-checkmark-outline" label="Privacy Policy" />
      </View>

      <SectionHeader title="" />
      <View style={styles.section}>
        <SettingRow
          icon="log-out-outline"
          label="Sign Out"
          onPress={handleSignOut}
          destructive
        />
      </View>

      <Text style={styles.version}>Taskero v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl * 2 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  section: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  rowPressed: { backgroundColor: "#F9FAFB" },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconDestructive: { backgroundColor: "#FEE2E2" },
  rowLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: "500" },
  rowLabelDestructive: { color: "#EF4444" },
  rowValue: { fontSize: 14, color: colors.subtext },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginLeft: spacing.md + 36 + spacing.sm },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: colors.subtext,
    marginTop: spacing.xl,
  },
});
