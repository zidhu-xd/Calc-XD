import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { Button } from "@/components/Button";
import { ChatColors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export default function PairingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { generatePairingCode, joinWithCode, isPaired } = useApp();

  const [mode, setMode] = useState<"choose" | "generate" | "join">("choose");
  const [generatedCode, setGeneratedCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isPaired) {
      navigation.replace("Chat");
    }
  }, [isPaired, navigation]);

  const handleGenerate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const code = await generatePairingCode();
    setGeneratedCode(code);
    setMode("generate");
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(generatedCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMode("join");
  };

  const handleJoin = async () => {
    if (inputCode.length < 6) {
      setError("Please enter a valid 6-character code");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await joinWithCode(inputCode.toUpperCase());
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace("Chat");
    } else {
      setError("Invalid pairing code");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleContinue = async () => {
    await joinWithCode(generatedCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.replace("Chat");
  };

  const renderChooseMode = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
      <Image
        source={require("../../assets/images/pairing-illustration.png")}
        style={styles.illustration}
        resizeMode="contain"
      />

      <Text style={styles.title}>Connect with Your Partner</Text>
      <Text style={styles.subtitle}>
        Create a private space just for you two. One person generates a code,
        the other joins with it.
      </Text>

      <View style={styles.buttonContainer}>
        <Button onPress={handleGenerate} style={styles.button}>
          Generate Pairing Code
        </Button>

        <Pressable
          style={styles.secondaryButton}
          onPress={handleJoinMode}
          testID="join-button"
        >
          <Text style={styles.secondaryButtonText}>I have a code</Text>
        </Pressable>
      </View>
    </Animated.View>
  );

  const renderGenerateMode = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
      <View style={styles.iconContainer}>
        <Feather name="link" size={48} color={ChatColors.primary} />
      </View>

      <Text style={styles.title}>Share This Code</Text>
      <Text style={styles.subtitle}>
        Send this code to your partner so they can join your private space
      </Text>

      <Animated.View
        entering={FadeInDown.delay(200).duration(400)}
        style={styles.codeContainer}
      >
        <Text style={styles.codeText}>{generatedCode}</Text>
        <Pressable
          style={styles.copyButton}
          onPress={handleCopyCode}
          testID="copy-code-button"
        >
          <Feather
            name={copied ? "check" : "copy"}
            size={20}
            color={ChatColors.primary}
          />
        </Pressable>
      </Animated.View>

      {copied ? (
        <Text style={styles.copiedText}>Copied to clipboard</Text>
      ) : null}

      <View style={styles.buttonContainer}>
        <Button onPress={handleContinue} style={styles.button}>
          Continue
        </Button>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => setMode("choose")}
          testID="back-button"
        >
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    </Animated.View>
  );

  const renderJoinMode = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
      <View style={styles.iconContainer}>
        <Feather name="users" size={48} color={ChatColors.primary} />
      </View>

      <Text style={styles.title}>Enter Pairing Code</Text>
      <Text style={styles.subtitle}>
        Enter the 6-character code your partner shared with you
      </Text>

      <TextInput
        style={styles.input}
        value={inputCode}
        onChangeText={(text) => {
          setInputCode(text.toUpperCase());
          setError("");
        }}
        placeholder="XXXXXX"
        placeholderTextColor={ChatColors.textSecondary}
        maxLength={6}
        autoCapitalize="characters"
        autoCorrect={false}
        testID="pairing-code-input"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonContainer}>
        <Button
          onPress={handleJoin}
          style={styles.button}
          disabled={inputCode.length < 6}
        >
          Join
        </Button>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => setMode("choose")}
          testID="back-button"
        >
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    </Animated.View>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
      ]}
    >
      {mode === "choose" && renderChooseMode()}
      {mode === "generate" && renderGenerateMode()}
      {mode === "join" && renderJoinMode()}
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
    paddingHorizontal: Spacing["2xl"],
  },
  illustration: {
    width: 200,
    height: 200,
    marginBottom: Spacing["2xl"],
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: ChatColors.receivedBubble,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
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
    lineHeight: 24,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ChatColors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  codeText: {
    fontSize: 32,
    fontWeight: "700",
    color: ChatColors.primary,
    letterSpacing: 4,
  },
  copyButton: {
    marginLeft: Spacing.lg,
    padding: Spacing.sm,
  },
  copiedText: {
    fontSize: Typography.small.fontSize,
    color: ChatColors.accent,
    marginBottom: Spacing.lg,
  },
  input: {
    width: "100%",
    height: 60,
    backgroundColor: ChatColors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    fontSize: 24,
    fontWeight: "600",
    color: ChatColors.textPrimary,
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.small.fontSize,
    color: "#FF3B30",
    marginBottom: Spacing.lg,
  },
  buttonContainer: {
    width: "100%",
    marginTop: "auto",
  },
  button: {
    marginBottom: Spacing.lg,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  secondaryButtonText: {
    fontSize: Typography.body.fontSize,
    color: ChatColors.primary,
    fontWeight: "600",
  },
});
