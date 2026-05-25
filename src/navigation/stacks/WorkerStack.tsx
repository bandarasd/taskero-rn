import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { WorkerSettingsScreen } from "../../screens/worker/WorkerSettingsScreen";
import { WorkerCertificationsScreen } from "../../screens/worker/WorkerCertificationsScreen";
import { RequestCertificationScreen } from "../../screens/worker/RequestCertificationScreen";
import { ServiceAreaPickerScreen } from "../../screens/worker/ServiceAreaPickerScreen";

// Screens
import { WorkerDashboardScreen } from "../../screens/worker/WorkerDashboardScreen";
import { WorkerJobsScreen } from "../../screens/worker/WorkerJobsScreen";
import { WorkerJobDetailScreen } from "../../screens/worker/WorkerJobDetailScreen";
import { WorkerActiveJobScreen } from "../../screens/worker/WorkerActiveJobScreen";
import { WorkerJobCompletionScreen } from "../../screens/worker/WorkerJobCompletionScreen";
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
  WorkerJobs: { initialTab?: "pending" | "active" | "completed" } | undefined;
  WorkerSchedule: undefined;
  WorkerMessages: undefined;
  WorkerProfile: undefined;

  // Job flow
  WorkerJobDetail: { taskId: string };
  WorkerActiveJob: { taskId: string };
  WorkerJobCompletion: { taskId: string };

  // Chat
  WorkerChat: { threadId: string; otherUserName: string; taskId?: string };

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

  // Certification flow
  WorkerCertifications: undefined;
  RequestCertification: { category: string };
  ServiceAreaPicker: {
    gigId: string | undefined;
    initialLat?: number;
    initialLng?: number;
    initialRadius?: number;
  };
};

const Stack = createNativeStackNavigator<WorkerStackParamList>();

export function WorkerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerBackTitle: "" }}>
      <Stack.Screen name="WorkerDashboard" component={WorkerDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkerJobs" component={WorkerJobsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkerJobDetail" component={WorkerJobDetailScreen} options={{ title: "Job Details" }} />
      <Stack.Screen name="WorkerActiveJob" component={WorkerActiveJobScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkerJobCompletion" component={WorkerJobCompletionScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkerSchedule" component={WorkerScheduleScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkerMessages" component={WorkerMessagesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkerChat" component={WorkerChatScreen} options={({ route }) => ({ title: route.params.otherUserName ?? "Chat" })} />
      <Stack.Screen name="WorkerProfile" component={WorkerProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkerServices" component={WorkerServicesScreen} options={{ title: "My Services" }} />
      <Stack.Screen name="AddEditService" component={AddEditServiceScreen} options={({ route }) => ({ title: route.params.gigId ? "Edit Service" : "Add Service" })} />
      <Stack.Screen name="WorkerEarnings" component={WorkerEarningsScreen} options={{ title: "Earnings" }} />
      <Stack.Screen name="WorkerReviews" component={WorkerReviewsScreen} options={{ title: "Reviews" }} />
      <Stack.Screen name="WorkerEditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
      <Stack.Screen name="TaskerAvailability" component={WorkerScheduleScreen} options={{ title: "Schedule" }} />
      <Stack.Screen name="WorkerNotifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <Stack.Screen name="WorkerSettings" component={WorkerSettingsScreen} options={{ title: "Settings" }} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} options={{ title: "Security" }} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: "Help Center" }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: "Privacy Policy" }} />
      <Stack.Screen name="WorkerCertifications" component={WorkerCertificationsScreen} options={{ title: "Certifications" }} />
      <Stack.Screen name="RequestCertification" component={RequestCertificationScreen} options={{ title: "Apply for Certification" }} />
      <Stack.Screen name="ServiceAreaPicker" component={ServiceAreaPickerScreen} options={{ title: "Set Service Area", presentation: "modal" }} />
    </Stack.Navigator>
  );
}

