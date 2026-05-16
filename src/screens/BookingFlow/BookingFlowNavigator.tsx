import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useRoute, RouteProp } from "@react-navigation/native";
import { GigBookingScreen } from "./GigBookingScreen";
import { LocationSelectionScreen } from "./LocationSelectionScreen";
import { DateTimeSelectionScreen } from "./DateTimeSelectionScreen";
import { ServiceSpecificBookingScreen } from "./ServiceSpecificBookingScreen";
import { ReviewSummaryScreen } from "./ReviewSummaryScreen";
import { PaymentScreen } from "./PaymentScreen";
import { PaymentSuccessScreen } from "./PaymentSuccessScreen";
import { ServiceCategory } from "../../types";
import type { CustomerStackParamList } from "../../navigation/stacks/CustomerStack";

export type BookingFlowParamList = {
  GigBooking: { gigId: string };
  LocationSelection: { gigId: string; notes?: string; imageUris?: string[] };
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
  Payment: {
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
        headerShown: false,
      }}
    >
      <Stack.Screen name="GigBooking" component={GigBookingScreen} initialParams={{ gigId }} />
      <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} />
      <Stack.Screen name="DateTimeSelection" component={DateTimeSelectionScreen} />
      <Stack.Screen name="ServiceSpecific" component={ServiceSpecificBookingScreen} />
      <Stack.Screen name="ReviewSummary" component={ReviewSummaryScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
    </Stack.Navigator>
  );
}
