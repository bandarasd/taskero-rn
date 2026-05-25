import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

// Screens
import { HomeScreen } from "../../screens/HomeScreen";
import { CategoriesScreen } from "../../screens/CategoriesScreen";
import { CategoryServicesScreen } from "../../screens/CategoryServicesScreen";
import { ServiceDetailScreen } from "../../screens/ServiceDetailScreen";
import { GigReviewsScreen } from "../../screens/GigReviewsScreen";
import { BookingsScreen } from "../../screens/BookingsScreen";
import { AppointmentDetailScreen } from "../../screens/AppointmentDetailScreen";
import { AddReviewScreen } from "../../screens/AddReviewScreen";
import { MessagesScreen } from "../../screens/MessagesScreen";
import { ChatScreen } from "../../screens/ChatScreen";
import { ProfileScreen } from "../../screens/ProfileScreen";
import { EditProfileScreen } from "../../screens/EditProfileScreen";
import { NotificationsScreen } from "../../screens/NotificationsScreen";
import { HelpCenterScreen } from "../../screens/HelpCenterScreen";
import { PrivacyPolicyScreen } from "../../screens/PrivacyPolicyScreen";
import { SecuritySettingsScreen } from "../../screens/SecuritySettingsScreen";
import { BookingFlowNavigator } from "../../screens/BookingFlow/BookingFlowNavigator";
import { ClientPaymentMethodsScreen } from "../../screens/ClientPaymentMethodsScreen";
import { MyReviewsScreen } from "../../screens/MyReviewsScreen";
import { Ionicons } from "@expo/vector-icons";
import type { CustomerStackParamList } from "../stacks/CustomerStack";
import { colors } from "../../theme/colors";
import { useUnreadMessageCount } from "../../hooks/useUnreadMessageCount";
import { useUnreadBookingNotificationCount } from "../../hooks/useUnreadBookingNotificationCount";
import { CustomerDelayResponseScreen } from "../../screens/CustomerDelayResponseScreen";

// ─── Shared stack screens (used across multiple tabs) ─────────────────────────

const sharedScreens = (Stack: ReturnType<typeof createNativeStackNavigator<CustomerStackParamList>>) => (
  <>
    <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: "", headerTransparent: true, headerTintColor: "#fff" }} />
    <Stack.Screen name="GigReviews" component={GigReviewsScreen} options={{ title: "Reviews" }} />
    <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: "Booking Details" }} />
    <Stack.Screen name="AddReview" component={AddReviewScreen} options={{ title: "Leave a Review" }} />
    <Stack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params.otherUserName ?? "Chat" })} />
    <Stack.Screen name="CategoryServices" component={CategoryServicesScreen} options={{ title: "" }} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
    <Stack.Screen name="ClientNotifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
    <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} options={{ title: "Security" }} />
    <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: "Help Center" }} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: "Privacy Policy" }} />
    <Stack.Screen name="BookingFlow" component={BookingFlowNavigator} options={{ headerShown: false }} />
    <Stack.Screen name="ClientPaymentMethods" component={ClientPaymentMethodsScreen} options={{ title: "Payment Methods" }} />
    <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ title: "My Reviews" }} />
    <Stack.Screen name="CustomerDelayResponse" component={CustomerDelayResponseScreen} options={{ headerShown: false }} />
  </>
);

// ─── Per-tab stacks ───────────────────────────────────────────────────────────

const HomeStack = createNativeStackNavigator<CustomerStackParamList>();
function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: true, headerBackTitle: "" }}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      {sharedScreens(HomeStack)}
    </HomeStack.Navigator>
  );
}

const CatStack = createNativeStackNavigator<CustomerStackParamList>();
function CategoriesStackNav() {
  return (
    <CatStack.Navigator screenOptions={{ headerShown: true, headerBackTitle: "" }}>
      <CatStack.Screen name="Categories" component={CategoriesScreen} options={{ headerShown: false }} />
      {sharedScreens(CatStack)}
    </CatStack.Navigator>
  );
}

const BookStack = createNativeStackNavigator<CustomerStackParamList>();
function BookingsStackNav() {
  return (
    <BookStack.Navigator screenOptions={{ headerShown: true, headerBackTitle: "" }}>
      <BookStack.Screen name="Bookings" component={BookingsScreen} options={{ headerShown: false }} />
      {sharedScreens(BookStack)}
    </BookStack.Navigator>
  );
}

const MsgStack = createNativeStackNavigator<CustomerStackParamList>();
function MessagesStackNav() {
  return (
    <MsgStack.Navigator screenOptions={{ headerShown: true, headerBackTitle: "" }}>
      <MsgStack.Screen name="Messages" component={MessagesScreen} options={{ headerShown: false }} />
      {sharedScreens(MsgStack)}
    </MsgStack.Navigator>
  );
}

const ProfStack = createNativeStackNavigator<CustomerStackParamList>();
function ProfileStackNav() {
  return (
    <ProfStack.Navigator screenOptions={{ headerShown: true, headerBackTitle: "" }}>
      <ProfStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      {sharedScreens(ProfStack)}
    </ProfStack.Navigator>
  );
}

// ─── Tab navigator ────────────────────────────────────────────────────────────

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

export type CustomerTabParamList = {
  HomeTab: undefined;
  CategoriesTab: undefined;
  BookingsTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<CustomerTabParamList>();

const TAB_ICONS: Record<keyof CustomerTabParamList, { active: any; inactive: any }> = {
  HomeTab:       { active: "home",           inactive: "home-outline" },
  CategoriesTab: { active: "grid",           inactive: "grid-outline" },
  BookingsTab:   { active: "receipt",        inactive: "receipt-outline" },
  MessagesTab:   { active: "chatbubbles",    inactive: "chatbubbles-outline" },
  ProfileTab:    { active: "person",         inactive: "person-outline" },
};

const LABELS: Record<keyof CustomerTabParamList, string> = {
  HomeTab: "Home", CategoriesTab: "Categories", BookingsTab: "Bookings", MessagesTab: "Messages", ProfileTab: "Profile",
};

export function CustomerTabs() {
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
            ? TAB_ICONS[route.name as keyof CustomerTabParamList].active
            : TAB_ICONS[route.name as keyof CustomerTabParamList].inactive;
          const showDot =
            (route.name === "MessagesTab" && unreadCount > 0) ||
            (route.name === "BookingsTab" && bookingNotifCount > 0);

          return (
            <View>
              <Ionicons name={iconName} size={26} color={color} />
              {showDot && <View style={styles.dot} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNav} options={{ tabBarLabel: LABELS.HomeTab }} />
      <Tab.Screen name="CategoriesTab" component={CategoriesStackNav} options={{ tabBarLabel: LABELS.CategoriesTab }} />
      <Tab.Screen name="BookingsTab" component={BookingsStackNav} options={{ tabBarLabel: LABELS.BookingsTab }} />
      <Tab.Screen name="MessagesTab" component={MessagesStackNav} options={{ tabBarLabel: LABELS.MessagesTab }} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNav} options={{ tabBarLabel: LABELS.ProfileTab }} />
    </Tab.Navigator>
  );
}

