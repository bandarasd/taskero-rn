import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CreateAccountScreen } from "../../screens/CreateAccountScreen";

export type CreateAccountStackParamList = {
  CreateAccount: undefined;
};

const Stack = createNativeStackNavigator<CreateAccountStackParamList>();

export function CreateAccountStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CreateAccount"
        component={CreateAccountScreen}
        options={{ title: "Create Account" }}
      />
    </Stack.Navigator>
  );
}
