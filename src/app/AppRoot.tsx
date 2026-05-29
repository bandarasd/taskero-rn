import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StripeProvider } from "@stripe/stripe-react-native";
import { AuthProvider } from "../store/authStore";
import { RootNavigator } from "../navigation/RootNavigator";
import { LoadingScreen } from "../screens/LoadingScreen";
import { env } from "../services/env";
import { queryClient } from "../lib/queryClient";

export function AppRoot() {
  const [isOnboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isBootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const loadState = async () => {
      const stored = await AsyncStorage.getItem("taskero_onboarding_completed");
      if (stored === "true") {
        setOnboardingCompleted(true);
      }
      setBootstrapping(false);
    };
    loadState().catch(() => setBootstrapping(false));
  }, []);

  const handleCompleteOnboarding = async () => {
    setOnboardingCompleted(true);
    await AsyncStorage.setItem("taskero_onboarding_completed", "true");
  };

  if (isBootstrapping) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider publishableKey={env.stripePublishableKey} merchantIdentifier="merchant.com.taskero">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NavigationContainer>
              <RootNavigator
                isOnboardingCompleted={isOnboardingCompleted}
                onCompleteOnboarding={handleCompleteOnboarding}
              />
            </NavigationContainer>
          </AuthProvider>
        </QueryClientProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
