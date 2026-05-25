import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useRoute, RouteProp } from "@react-navigation/native";
import { LocationSelectionScreen } from "./LocationSelectionScreen";
import { DateTimeSelectionScreen } from "./DateTimeSelectionScreen";
import { ServiceSpecificBookingScreen } from "./ServiceSpecificBookingScreen";
import { ReviewSummaryScreen } from "./ReviewSummaryScreen";
import { PaymentScreen } from "./PaymentScreen";
import { PaymentSuccessScreen } from "./PaymentSuccessScreen";
import { ServiceCategory } from "../../types";
import type { CustomerStackParamList } from "../../navigation/stacks/CustomerStack";

export type BookingFlowParamList = {
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
    imageUris?: string[];
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
    imageUris?: string[];
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
      <Stack.Screen name="LocationSelection" component={LocationSelectionScreen} initialParams={{ gigId }} />
      <Stack.Screen name="DateTimeSelection" component={DateTimeSelectionScreen} />
      <Stack.Screen name="ServiceSpecific" component={ServiceSpecificBookingScreen} />
      <Stack.Screen name="ReviewSummary" component={ReviewSummaryScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
    </Stack.Navigator>
  );
}
