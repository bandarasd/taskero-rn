import React from "react";
import { useAuth } from "../store/authStore";
import { AuthStack } from "./stacks/AuthStack";
import { OnboardingStack } from "./stacks/OnboardingStack";
import { CreateAccountStack } from "./stacks/CreateAccountStack";
import { CustomerTabs } from "./tabs/CustomerTabs";
import { WorkerTabs } from "./tabs/WorkerTabs";
import { LoadingScreen } from "../screens/LoadingScreen";

export function RootNavigator({
  isOnboardingCompleted,
  onCompleteOnboarding,
}: {
  isOnboardingCompleted: boolean;
  onCompleteOnboarding: () => void;
}) {
  const { isAuthenticated, isAuthLoading, hasProfile, role } = useAuth();

  if (isAuthLoading) return <LoadingScreen />;
  if (!isOnboardingCompleted) return <OnboardingStack onComplete={onCompleteOnboarding} />;
  if (!isAuthenticated) return <AuthStack />;
  if (!hasProfile) return <CreateAccountStack />;
  return role === "worker" ? <WorkerTabs /> : <CustomerTabs />;
}
