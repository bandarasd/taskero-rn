import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import { WorkerDashboardScreen } from "../../screens/worker/WorkerDashboardScreen";
import { WorkerJobsScreen } from "../../screens/worker/WorkerJobsScreen";
import { WorkerJobDetailScreen } from "../../screens/worker/WorkerJobDetailScreen";
import { WorkerScheduleScreen } from "../../screens/worker/WorkerScheduleScreen";
import { WorkerMessagesScreen } from "../../screens/worker/WorkerMessagesScreen";
import { WorkerChatScreen } from "../../screens/worker/WorkerChatScreen";
import { WorkerProfileScreen } from "../../screens/worker/WorkerProfileScreen";
import { WorkerServicesScreen } from "../../screens/worker/WorkerServicesScreen";
import { AddEditServiceScreen } from "../../screens/worker/AddEditServiceScreen";
import { WorkerEarningsScreen } from "../../screens/worker/WorkerEarningsScreen";
import { WorkerReviewsScreen } from "../../screens/worker/WorkerReviewsScreen";
import { NotificationsScreen } from "../../screens/NotificationsScreen";
import { HelpCenterScreen } from "../../screens/HelpCenterScreen";
import { PrivacyPolicyScreen } from "../../screens/PrivacyPolicyScreen";
import { SecuritySettingsScreen } from "../../screens/SecuritySettingsScreen";
import { EditProfileScreen } from "../../screens/EditProfileScreen";

export type WorkerStackParamList = {
  // Tab roots
  WorkerDashboard: undefined;
  WorkerJobs: undefined;
  WorkerSchedule: undefined;
  WorkerMessages: undefined;
  WorkerProfile: undefined;

  // Job flow
  WorkerJobDetail: { taskId: string };

  // Chat
  WorkerChat: { threadId: string; otherUserName: string };

  // Profile sub-screens
  WorkerServices: undefined;
  AddEditService: { gigId: string | undefined };
  WorkerEarnings: undefined;
  WorkerReviews: undefined;
  WorkerEditProfile: undefined;
  TaskerAvailability: undefined;
  WorkerNotifications: undefined;
  WorkerSettings: undefined;
  SecuritySettings: undefined;
  HelpCenter: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createNativeStackNavigator<WorkerStackParamList>();

export function WorkerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerBackTitle: "" }}>
      <Stack.Screen name="WorkerDashboard" component={WorkerDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkerJobs" component={WorkerJobsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkerJobDetail" component={WorkerJobDetailScreen} options={{ title: "Job Details" }} />
      <Stack.Screen name="WorkerSchedule" component={WorkerScheduleScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkerMessages" component={WorkerMessagesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkerChat" component={WorkerChatScreen} options={({ route }) => ({ title: (route.params as any).otherUserName ?? "Chat" })} />
      <Stack.Screen name="WorkerProfile" component={WorkerProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkerServices" component={WorkerServicesScreen} options={{ title: "My Services" }} />
      <Stack.Screen name="AddEditService" component={AddEditServiceScreen} options={({ route }) => ({ title: (route.params as any).gigId ? "Edit Service" : "Add Service" })} />
      <Stack.Screen name="WorkerEarnings" component={WorkerEarningsScreen} options={{ title: "Earnings" }} />
      <Stack.Screen name="WorkerReviews" component={WorkerReviewsScreen} options={{ title: "Reviews" }} />
      <Stack.Screen name="WorkerEditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
      <Stack.Screen name="TaskerAvailability" component={WorkerScheduleScreen} options={{ title: "Schedule" }} />
      <Stack.Screen name="WorkerNotifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <Stack.Screen name="WorkerSettings" component={PlaceholderScreen("Settings")} options={{ title: "Settings" }} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} options={{ title: "Security" }} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: "Help Center" }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: "Privacy Policy" }} />
    </Stack.Navigator>
  );
}

function PlaceholderScreen(title: string) {
  return function Placeholder() {
    const { View, Text } = require("react-native");
    const { colors } = require("../../theme/colors");
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{title}</Text>
        <Text style={{ fontSize: 14, color: colors.subtext, marginTop: 8 }}>Coming soon</Text>
      </View>
    );
  };
}
