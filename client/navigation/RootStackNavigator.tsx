import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CalculatorScreen from "@/screens/CalculatorScreen";
import SetupScreen from "@/screens/SetupScreen";
import PairingScreen from "@/screens/PairingScreen";
import ChatScreen from "@/screens/ChatScreen";
import SettingsScreen from "@/screens/SettingsScreen";

export type RootStackParamList = {
  Calculator: undefined;
  Setup: { code?: string };
  Pairing: undefined;
  Chat: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Calculator"
      screenOptions={{
        headerShown: false,
        animation: "fade",
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Calculator" component={CalculatorScreen} />
      <Stack.Screen
        name="Setup"
        component={SetupScreen}
        options={{
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="Pairing"
        component={PairingScreen}
        options={{
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          animation: "slide_from_right",
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}
