import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  AppState,
  AppStateStatus,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ChatColors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import * as Storage from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface SettingsItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function SettingsItem({ icon, label, onPress, destructive }: SettingsItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsItem,
        pressed ? styles.settingsItemPressed : null,
      ]}
      onPress={onPress}
    >
      <Feather
        name={icon as any}
        size={22}
        color={destructive ? "#FF3B30" : ChatColors.primary}
      />
      <Text
        style={[styles.settingsItemText, destructive ? styles.destructiveText : null]}
      >
        {label}
      </Text>
      <Feather name="chevron-right" size={20} color={ChatColors.textSecondary} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lock, unpair, pairedWith } = useApp();

  const [showCodeModal, setShowCodeModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
        if (nextAppState === "background" || nextAppState === "inactive") {
          lock();
          navigation.replace("Calculator");
        }
      });

      return () => subscription.remove();
    }, [lock, navigation])
  );
  const [showUnpairModal, setShowUnpairModal] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [codeStep, setCodeStep] = useState<"new" | "confirm">("new");
  const [error, setError] = useState("");

  const handleChangeCode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCodeModal(true);
    setCodeStep("new");
    setNewCode("");
    setConfirmCode("");
    setError("");
  };

  const handleCodeSubmit = async () => {
    if (codeStep === "new") {
      if (newCode.length !== 4) {
        setError("Code must be 4 digits");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      setCodeStep("confirm");
      setError("");
    } else {
      if (confirmCode !== newCode) {
        setError("Codes don't match");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setConfirmCode("");
        return;
      }
      await Storage.setUnlockCode(newCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCodeModal(false);
    }
  };

  const handleUnpair = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowUnpairModal(true);
  };

  const confirmUnpair = async () => {
    await unpair();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowUnpairModal(false);
    lock();
    navigation.replace("Calculator");
  };

  const handleLockExit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    lock();
    navigation.replace("Calculator");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          testID="back-button"
        >
          <Feather name="arrow-left" size={24} color={ChatColors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
      >
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.section}>
            <SettingsItem
              icon="lock"
              label="Change Unlock Code"
              onPress={handleChangeCode}
            />
          </View>

          <Text style={styles.sectionTitle}>Connection</Text>
          <View style={styles.section}>
            <View style={styles.infoItem}>
              <Feather name="link" size={22} color={ChatColors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Pairing Code</Text>
                <Text style={styles.infoValue}>{pairedWith || "Not paired"}</Text>
              </View>
            </View>
            <SettingsItem
              icon="user-minus"
              label="Unpair Device"
              onPress={handleUnpair}
              destructive
            />
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.section}>
            <SettingsItem
              icon="log-out"
              label="Lock & Exit"
              onPress={handleLockExit}
            />
          </View>

          <Text style={styles.footerText}>
            Your messages are stored locally on this device only.
            Unpairing will delete all messages.
          </Text>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showCodeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.xl }]}>
            <Text style={styles.modalTitle}>
              {codeStep === "new" ? "Enter New Code" : "Confirm New Code"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {codeStep === "new"
                ? "Choose a 4-digit code"
                : "Enter the code again to confirm"}
            </Text>

            <TextInput
              style={styles.codeInput}
              value={codeStep === "new" ? newCode : confirmCode}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, "").slice(0, 4);
                if (codeStep === "new") {
                  setNewCode(digits);
                } else {
                  setConfirmCode(digits);
                }
                setError("");
              }}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              autoFocus
              testID="code-input"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowCodeModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                onPress={handleCodeSubmit}
              >
                <Text style={styles.modalConfirmText}>
                  {codeStep === "new" ? "Next" : "Confirm"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showUnpairModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowUnpairModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertContent}>
            <Feather name="alert-triangle" size={48} color="#FF3B30" />
            <Text style={styles.alertTitle}>Unpair Device?</Text>
            <Text style={styles.alertMessage}>
              This will delete all messages and disconnect from your partner.
              This action cannot be undone.
            </Text>

            <View style={styles.alertButtons}>
              <Pressable
                style={styles.alertCancelButton}
                onPress={() => setShowUnpairModal(false)}
              >
                <Text style={styles.alertCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.alertConfirmButton}
                onPress={confirmUnpair}
              >
                <Text style={styles.alertConfirmText}>Unpair</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChatColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: ChatColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ChatColors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: "600",
    color: ChatColors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.small.fontSize,
    fontWeight: "600",
    color: ChatColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  section: {
    backgroundColor: ChatColors.surface,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ChatColors.border,
  },
  settingsItemPressed: {
    backgroundColor: ChatColors.receivedBubble,
  },
  settingsItemText: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    color: ChatColors.textPrimary,
    marginLeft: Spacing.md,
  },
  destructiveText: {
    color: "#FF3B30",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ChatColors.border,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoLabel: {
    fontSize: Typography.small.fontSize,
    color: ChatColors.textSecondary,
  },
  infoValue: {
    fontSize: Typography.body.fontSize,
    color: ChatColors.textPrimary,
    fontWeight: "500",
  },
  footerText: {
    fontSize: Typography.small.fontSize,
    color: ChatColors.textSecondary,
    textAlign: "center",
    marginTop: Spacing["3xl"],
    paddingHorizontal: Spacing.lg,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: ChatColors.surface,
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: "600",
    color: ChatColors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: Typography.body.fontSize,
    color: ChatColors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  codeInput: {
    height: 60,
    backgroundColor: ChatColors.background,
    borderRadius: BorderRadius.md,
    fontSize: 32,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 16,
    color: ChatColors.textPrimary,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.small.fontSize,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: ChatColors.background,
  },
  modalCancelText: {
    fontSize: Typography.body.fontSize,
    color: ChatColors.textSecondary,
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    marginLeft: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: ChatColors.primary,
  },
  modalConfirmText: {
    fontSize: Typography.body.fontSize,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  alertContent: {
    backgroundColor: ChatColors.surface,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    alignSelf: "center",
    marginTop: "auto",
    marginBottom: "auto",
  },
  alertTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: "600",
    color: ChatColors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  alertMessage: {
    fontSize: Typography.body.fontSize,
    color: ChatColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  alertButtons: {
    flexDirection: "row",
    width: "100%",
  },
  alertCancelButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: ChatColors.background,
  },
  alertCancelText: {
    fontSize: Typography.body.fontSize,
    color: ChatColors.textPrimary,
    fontWeight: "600",
  },
  alertConfirmButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    marginLeft: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: "#FF3B30",
  },
  alertConfirmText: {
    fontSize: Typography.body.fontSize,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
