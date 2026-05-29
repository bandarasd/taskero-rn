import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

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
import { WorkerCalendarScreen } from "../../screens/worker/WorkerCalendarScreen";
import { AddEditServiceScreen } from "../../screens/worker/AddEditServiceScreen";
import { WorkerEarningsScreen } from "../../screens/worker/WorkerEarningsScreen";
import { WorkerReviewsScreen } from "../../screens/worker/WorkerReviewsScreen";
import { EditProfileScreen } from "../../screens/EditProfileScreen";
import { NotificationsScreen } from "../../screens/NotificationsScreen";
import { HelpCenterScreen } from "../../screens/HelpCenterScreen";
import { PrivacyPolicyScreen } from "../../screens/PrivacyPolicyScreen";
import { SecuritySettingsScreen } from "../../screens/SecuritySettingsScreen";
import { WorkerSettingsScreen } from "../../screens/worker/WorkerSettingsScreen";
import { WorkerCertificationsScreen } from "../../screens/worker/WorkerCertificationsScreen";
import { RequestCertificationScreen } from "../../screens/worker/RequestCertificationScreen";
import { ServiceAreaPickerScreen } from "../../screens/worker/ServiceAreaPickerScreen";
import { Ionicons } from "@expo/vector-icons";
import type { WorkerStackParamList } from "../stacks/WorkerStack";
import { colors } from "../../theme/colors";
import { useUnreadMessageCount } from "../../hooks/useUnreadMessageCount";
import { useUnreadBookingNotificationCount } from "../../hooks/useUnreadBookingNotificationCount";

// ─── Shared screens across worker tabs ───────────────────────────────────────

const sharedScreens = (Stack: ReturnType<typeof createNativeStackNavigator<WorkerStackParamList>>) => (
  <>
    <Stack.Screen name="WorkerJobDetail" component={WorkerJobDetailScreen} options={{ title: "Job Details" }} />
    <Stack.Screen name="WorkerActiveJob" component={WorkerActiveJobScreen} options={{ headerShown: false }} />
    <Stack.Screen name="WorkerJobCompletion" component={WorkerJobCompletionScreen} options={{ headerShown: false }} />
    <Stack.Screen name="WorkerChat" component={WorkerChatScreen} options={({ route }) => ({ title: route.params.otherUserName ?? "Chat" })} />
    <Stack.Screen name="WorkerServices" component={WorkerServicesScreen} options={{ title: "My Services" }} />
    <Stack.Screen name="AddEditService" component={AddEditServiceScreen} options={({ route }) => ({ title: route.params.gigId ? "Edit Service" : "Add Service" })} />
    <Stack.Screen name="WorkerEarnings" component={WorkerEarningsScreen} options={{ title: "Earnings" }} />
    <Stack.Screen name="WorkerReviews" component={WorkerReviewsScreen} options={{ title: "Reviews" }} />
    <Stack.Screen name="WorkerEditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
    <Stack.Screen name="TaskerAvailability" component={WorkerScheduleScreen} options={{ title: "Availability" }} />
    <Stack.Screen name="WorkerNotifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
    <Stack.Screen name="WorkerSettings" component={WorkerSettingsScreen} options={{ title: "Settings" }} />
    <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} options={{ title: "Security" }} />
    <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: "Help Center" }} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: "Privacy Policy" }} />
    <Stack.Screen name="WorkerCertifications" component={WorkerCertificationsScreen} options={{ title: "Certifications" }} />
    <Stack.Screen name="RequestCertification" component={RequestCertificationScreen} options={{ title: "Apply for Certification" }} />
    <Stack.Screen name="ServiceAreaPicker" component={ServiceAreaPickerScreen} options={{ title: "Set Service Area", presentation: "modal" }} />
  </>
);

// ─── Per-tab stacks ───────────────────────────────────────────────────────────

const DashStack = createNativeStackNavigator<WorkerStackParamList>();
function DashboardStackNav() {
  return (
    <DashStack.Navigator screenOptions={{ headerShown: true, headerBackTitle: "" }}>
      <DashStack.Screen name="WorkerDashboard" component={WorkerDashboardScreen} options={{ headerShown: false }} />
      {sharedScreens(DashStack)}
    </DashStack.Navigator>
  );
}

const JobsStack = createNativeStackNavigator<WorkerStackParamList>();
function JobsStackNav() {
  return (
    <JobsStack.Navigator screenOptions={{ headerShown: true, headerBackTitle: "" }}>
      <JobsStack.Screen name="WorkerJobs" component={WorkerJobsScreen} options={{ headerShown: false }} />
      {sharedScreens(JobsStack)}
    </JobsStack.Navigator>
  );
}

const SchedStack = createNativeStackNavigator<WorkerStackParamList>();
function ScheduleStackNav() {
  return (
    <SchedStack.Navigator screenOptions={{ headerShown: true, headerBackTitle: "" }}>
      <SchedStack.Screen name="WorkerCalendar" component={WorkerCalendarScreen} options={{ headerShown: false }} />
      <SchedStack.Screen name="WorkerSchedule" component={WorkerScheduleScreen} options={{ title: "Availability" }} />
      {sharedScreens(SchedStack)}
    </SchedStack.Navigator>
  );
}

const MsgStack = createNativeStackNavigator<WorkerStackParamList>();
function MessagesStackNav() {
  return (
    <MsgStack.Navigator screenOptions={{ headerShown: true, headerBackTitle: "" }}>
      <MsgStack.Screen name="WorkerMessages" component={WorkerMessagesScreen} options={{ headerShown: false }} />
      {sharedScreens(MsgStack)}
    </MsgStack.Navigator>
  );
}

const ProfStack = createNativeStackNavigator<WorkerStackParamList>();
function ProfileStackNav() {
  return (
    <ProfStack.Navigator screenOptions={{ headerShown: true, headerBackTitle: "" }}>
      <ProfStack.Screen name="WorkerProfile" component={WorkerProfileScreen} options={{ headerShown: false }} />
      {sharedScreens(ProfStack)}
    </ProfStack.Navigator>
  );
}

// ─── Tab navigator ────────────────────────────────────────────────────────────

export type WorkerTabParamList = {
  DashboardTab: undefined;
  JobsTab: undefined;
  ScheduleTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<WorkerTabParamList>();

const ICONS: Record<keyof WorkerTabParamList, { active: any; inactive: any }> = {
  DashboardTab: { active: "grid", inactive: "grid-outline" },
  JobsTab:      { active: "briefcase", inactive: "briefcase-outline" },
  ScheduleTab:  { active: "calendar-number", inactive: "calendar-number-outline" },
  MessagesTab:  { active: "chatbubbles", inactive: "chatbubbles-outline" },
  ProfileTab:   { active: "person", inactive: "person-outline" },
};

const LABELS: Record<keyof WorkerTabParamList, string> = {
  DashboardTab: "Dashboard",
  JobsTab: "Jobs",
  ScheduleTab: "Calendar",
  MessagesTab: "Messages",
  ProfileTab: "Profile",
};

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#fff",
  },
});

export function WorkerTabs() {
  const unreadCount = useUnreadMessageCount();
  const bookingNotifCount = useUnreadBookingNotificationCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brandGreen,
        tabBarInactiveTintColor: colors.subtext,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 12,
          height: 72,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          const iconName = focused
            ? ICONS[route.name as keyof WorkerTabParamList].active
            : ICONS[route.name as keyof WorkerTabParamList].inactive;
          const showDot =
            (route.name === "MessagesTab" && unreadCount > 0) ||
            (route.name === "JobsTab" && bookingNotifCount > 0);

          return (
            <View>
              <Ionicons name={iconName} size={26} color={color} />
              {showDot && <View style={styles.dot} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackNav}
        options={{ tabBarLabel: LABELS.DashboardTab }}
      />
      <Tab.Screen
        name="JobsTab"
        component={JobsStackNav}
        options={{ tabBarLabel: LABELS.JobsTab }}
      />
      <Tab.Screen
        name="ScheduleTab"
        component={ScheduleStackNav}
        options={{ tabBarLabel: LABELS.ScheduleTab }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesStackNav}
        options={{ tabBarLabel: LABELS.MessagesTab }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNav}
        options={{ tabBarLabel: LABELS.ProfileTab }}
      />
    </Tab.Navigator>
  );
}

