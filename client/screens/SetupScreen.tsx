import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  FadeIn,
} from "react-native-reanimated";

import { ChatColors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type SetupScreenRouteProp = RouteProp<RootStackParamList, "Setup">;

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<SetupScreenRouteProp>();
  const { setupComplete } = useApp();

  const [code, setCode] = useState(route.params?.code || "");
  const [confirmCode, setConfirmCode] = useState("");
  const [step, setStep] = useState<"create" | "confirm">(
    route.params?.code ? "confirm" : "create"
  );
  const [error, setError] = useState("");

  const shakeX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const shake = () => {
    shakeX.value = withSequence(
      withSpring(10, { damping: 2, stiffness: 500 }),
      withSpring(-10, { damping: 2, stiffness: 500 }),
      withSpring(10, { damping: 2, stiffness: 500 }),
      withSpring(0, { damping: 2, stiffness: 500 })
    );
  };

  const handleNumberPress = (num: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError("");

    if (step === "create") {
      if (code.length < 4) {
        const newCode = code + num;
        setCode(newCode);
        if (newCode.length === 4) {
          setTimeout(() => setStep("confirm"), 300);
        }
      }
    } else {
      if (confirmCode.length < 4) {
        const newConfirm = confirmCode + num;
        setConfirmCode(newConfirm);
        if (newConfirm.length === 4) {
          if (newConfirm === code) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            handleComplete(code);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            shake();
            setError("Codes don't match. Try again.");
            setConfirmCode("");
          }
        }
      }
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === "create") {
      setCode(code.slice(0, -1));
    } else {
      setConfirmCode(confirmCode.slice(0, -1));
    }
  };

  const handleComplete = async (finalCode: string) => {
    await setupComplete(finalCode);
    navigation.replace("Pairing");
  };

  const currentCode = step === "create" ? code : confirmCode;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
        <Text style={styles.title}>
          {step === "create" ? "Create Your Secret Code" : "Confirm Your Code"}
        </Text>
        <Text style={styles.subtitle}>
          {step === "create"
            ? "This 4-digit code will unlock your private space"
            : "Enter the code again to confirm"}
        </Text>

        <Animated.View style={[styles.dotsContainer, animatedStyle]}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentCode.length > i ? styles.dotFilled : null,
                error ? styles.dotError : null,
              ]}
            />
          ))}
        </Animated.View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={[styles.keypad, { paddingBottom: insets.bottom + 20 }]}>
          {[
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"],
            ["", "0", "del"],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key, keyIndex) => {
                if (key === "") {
                  return <View key={keyIndex} style={styles.keyEmpty} />;
                }
                if (key === "del") {
                  return (
                    <Pressable
                      key={keyIndex}
                      style={styles.key}
                      onPress={handleDelete}
                      testID="setup-delete"
                    >
                      <Text style={styles.keyTextSmall}>Delete</Text>
                    </Pressable>
                  );
                }
                return (
                  <Pressable
                    key={keyIndex}
                    style={({ pressed }) => [
                      styles.key,
                      pressed ? styles.keyPressed : null,
                    ]}
                    onPress={() => handleNumberPress(key)}
                    testID={`setup-key-${key}`}
                  >
                    <Text style={styles.keyText}>{key}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChatColors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontSize: Typography.h3.fontSize,
    fontWeight: "700",
    color: ChatColors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    color: ChatColors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing["3xl"],
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ChatColors.primary,
    marginHorizontal: Spacing.sm,
  },
  dotFilled: {
    backgroundColor: ChatColors.primary,
  },
  dotError: {
    borderColor: "#FF3B30",
    backgroundColor: "#FF3B30",
  },
  errorText: {
    fontSize: Typography.small.fontSize,
    color: "#FF3B30",
    marginBottom: Spacing.lg,
  },
  keypad: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
    maxWidth: 300,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ChatColors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  keyEmpty: {
    width: 80,
    height: 80,
  },
  keyPressed: {
    backgroundColor: ChatColors.receivedBubble,
  },
  keyText: {
    fontSize: 28,
    fontWeight: "500",
    color: ChatColors.textPrimary,
  },
  keyTextSmall: {
    fontSize: 14,
    fontWeight: "500",
    color: ChatColors.textSecondary,
  },
});
