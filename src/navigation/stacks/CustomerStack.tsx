import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ClientPaymentMethodsScreen } from "../../screens/ClientPaymentMethodsScreen";
import { MyReviewsScreen } from "../../screens/MyReviewsScreen";
import { ServiceCategory } from "../../types";

// Screens
import { HomeScreen } from "../../screens/HomeScreen";
import { CategoriesScreen } from "../../screens/CategoriesScreen";
import { CategoryServicesScreen } from "../../screens/CategoryServicesScreen";
import { ServiceDetailScreen } from "../../screens/ServiceDetailScreen";
import { GigReviewsScreen } from "../../screens/GigReviewsScreen";
import { BookingsScreen } from "../../screens/BookingsScreen";
import { AppointmentDetailScreen } from "../../screens/AppointmentDetailScreen";
import { MessagesScreen } from "../../screens/MessagesScreen";
import { ChatScreen } from "../../screens/ChatScreen";
import { ProfileScreen } from "../../screens/ProfileScreen";
import { EditProfileScreen } from "../../screens/EditProfileScreen";
import { AddReviewScreen } from "../../screens/AddReviewScreen";
import { NotificationsScreen } from "../../screens/NotificationsScreen";
import { HelpCenterScreen } from "../../screens/HelpCenterScreen";
import { PrivacyPolicyScreen } from "../../screens/PrivacyPolicyScreen";
import { SecuritySettingsScreen } from "../../screens/SecuritySettingsScreen";
import { BookingFlowNavigator } from "../../screens/BookingFlow/BookingFlowNavigator";
import { CustomerDelayResponseScreen } from "../../screens/CustomerDelayResponseScreen";

export type CustomerStackParamList = {
  // Tab roots
  Home: undefined;
  Categories: undefined;
  Bookings: undefined;
  Messages: undefined;
  Profile: undefined;

  // Category flow
  CategoryServices: { category: string };
  ServiceDetail: { gigId: string };
  GigReviews: { gigId: string };

  // Booking detail
  AppointmentDetail: { taskId: string };
  AddReview: { taskId?: string; gigId?: string; taskerId: string };

  // Chat
  Chat: { threadId: string; otherUserName: string; taskId?: string };

  // Profile sub-screens
  EditProfile: undefined;
  ClientPaymentMethods: undefined;
  MyReviews: undefined;
  ClientNotifications: undefined;
  SecuritySettings: undefined;
  HelpCenter: undefined;
  PrivacyPolicy: undefined;

  // Booking flow (nested navigator)
  BookingFlow: { gigId: string };

  // Delay response
  CustomerDelayResponse: { taskId: string };
};

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export function CustomerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerBackTitle: "" }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Categories" component={CategoriesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CategoryServices" component={CategoryServicesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: "Service", headerTransparent: true, headerTintColor: "#fff" }} />
      <Stack.Screen name="GigReviews" component={GigReviewsScreen} options={{ title: "Reviews" }} />
      <Stack.Screen name="Bookings" component={BookingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: "Booking Details" }} />
      <Stack.Screen name="AddReview" component={AddReviewScreen} options={{ title: "Leave a Review" }} />
      <Stack.Screen name="Messages" component={MessagesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params.otherUserName ?? "Chat" })} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
      <Stack.Screen name="ClientPaymentMethods" component={ClientPaymentMethodsScreen} options={{ title: "Payment Methods" }} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ title: "My Reviews" }} />
      <Stack.Screen name="ClientNotifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} options={{ title: "Security" }} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: "Help Center" }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: "Privacy Policy" }} />
      <Stack.Screen name="BookingFlow" component={BookingFlowNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="CustomerDelayResponse" component={CustomerDelayResponseScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// Lightweight placeholder for screens not yet implemented
