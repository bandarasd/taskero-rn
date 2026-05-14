import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useRoute, RouteProp } from "@react-navigation/native";
import { GigBookingScreen } from "./GigBookingScreen";
import { LocationSelectionScreen } from "./LocationSelectionScreen";
import { DateTimeSelectionScreen } from "./DateTimeSelectionScreen";
import { ServiceSpecificBookingScreen } from "./ServiceSpecificBookingScreen";
import { ReviewSummaryScreen } from "./ReviewSummaryScreen";
import { PaymentSuccessScreen } from "./PaymentSuccessScreen";
import { ServiceCategory } from "../../types";
import type { CustomerStackParamList } from "../../navigation/stacks/CustomerStack";

export type BookingFlowParamList = {
  GigBooking: { gigId: string };
  LocationSelection: { gigId: string };
  DateTimeSelection: { gigId: string; taskerId: string; address: string; latitude?: number; longitude?: number };
  ServiceSpecific: { gigId: string; taskerId: string; address: string; latitude?: number; longitude?: number; scheduledAt: string; category: ServiceCategory };
  ReviewSummary: {
    gigId: string;
    taskerId: string;
    address: string;
    latitude?: number;
    longitude?: number;
    scheduledAt: string;
    category: ServiceCategory;
    details: Record<string, string | number>;
    basePrice: number;
    notes?: string;
  };
  PaymentSuccess: { taskId: string };
};

const Stack = createNativeStackNavigator<BookingFlowParamList>();

type RouteProps = RouteProp<CustomerStackParamList, "BookingFlow">;

export function BookingFlowNavigator() {
  const route = useRoute<RouteProps>();
  const { gigId } = route.params;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontSize: 16, fontWeight: "700", color: "#111111" },
        headerTintColor: "#00BF63",
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="GigBooking" component={GigBookingScreen} initialParams={{ gigId }} options={{ title: "Book Service" }} />
      <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} options={{ title: "Select Location" }} />
      <Stack.Screen name="DateTimeSelection" component={DateTimeSelectionScreen} options={{ title: "Choose Date & Time" }} />
      <Stack.Screen name="ServiceSpecific" component={ServiceSpecificBookingScreen} options={{ title: "Service Details" }} />
      <Stack.Screen name="ReviewSummary" component={ReviewSummaryScreen} options={{ title: "Review & Confirm" }} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
