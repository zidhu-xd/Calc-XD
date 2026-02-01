import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Image,
  ListRenderItem,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInUp, SlideInRight } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ChatColors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { Message } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showTimestamp: boolean;
}

function MessageBubble({ message, isMine, showTimestamp }: MessageBubbleProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Animated.View
      entering={isMine ? SlideInRight.duration(300) : FadeInUp.duration(300)}
      style={[styles.messageBubbleContainer, isMine ? styles.myMessage : styles.theirMessage]}
    >
      <View
        style={[
          styles.messageBubble,
          isMine ? styles.myBubble : styles.theirBubble,
        ]}
      >
        <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>
          {message.text}
        </Text>
      </View>
      {showTimestamp ? (
        <Text style={[styles.timestamp, isMine ? styles.myTimestamp : styles.theirTimestamp]}>
          {formatTime(message.timestamp)}
        </Text>
      ) : null}
    </Animated.View>
  );
}

function EmptyState() {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.emptyContainer}>
      <Image
        source={require("../../assets/images/empty-chat.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Your Private Space</Text>
      <Text style={styles.emptySubtitle}>
        Messages between you and your partner will appear here. Start chatting!
      </Text>
    </Animated.View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { messages, sendMessage, deviceId, lock, isUnlocked } = useApp();
  const flatListRef = useRef<FlatList>(null);

  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (!isUnlocked) {
      navigation.replace("Calculator");
    }
  }, [isUnlocked, navigation]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendMessage(inputText.trim());
    setInputText("");
  }, [inputText, sendMessage]);

  const handleSettings = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Settings");
  }, [navigation]);

  const handleLock = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    lock();
    navigation.replace("Calculator");
  }, [lock, navigation]);

  const shouldShowTimestamp = (index: number, message: Message): boolean => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const timeDiff = message.timestamp - prevMessage.timestamp;
    return timeDiff > 5 * 60 * 1000;
  };

  const renderMessage: ListRenderItem<Message> = useCallback(
    ({ item, index }) => {
      const isMine = item.senderId === deviceId;
      const showTimestamp = shouldShowTimestamp(messages.length - 1 - index, item);
      return (
        <MessageBubble
          message={item}
          isMine={isMine}
          showTimestamp={showTimestamp}
        />
      );
    },
    [deviceId, messages]
  );

  const reversedMessages = messages.slice().reverse();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable style={styles.headerButton} onPress={handleLock} testID="lock-button">
          <Feather name="lock" size={22} color={ChatColors.primary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Image
            source={require("../../assets/images/default-avatar.png")}
            style={styles.avatar}
          />
          <Text style={styles.headerTitle}>My Love</Text>
        </View>

        <Pressable style={styles.headerButton} onPress={handleSettings} testID="settings-button">
          <Feather name="settings" size={22} color={ChatColors.primary} />
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContent,
          messages.length === 0 ? styles.emptyContent : null,
        ]}
        data={reversedMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted={messages.length > 0}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={ChatColors.textSecondary}
            multiline
            maxLength={1000}
            testID="message-input"
          />
          <Pressable
            style={[
              styles.sendButton,
              !inputText.trim() ? styles.sendButtonDisabled : null,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            testID="send-button"
          >
            <Feather
              name="send"
              size={20}
              color={inputText.trim() ? "#FFFFFF" : ChatColors.textSecondary}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: Spacing.md,
    backgroundColor: ChatColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ChatColors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: "600",
    color: ChatColors.textPrimary,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
  },
  messageBubbleContainer: {
    marginBottom: Spacing.sm,
    maxWidth: "80%",
  },
  myMessage: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  theirMessage: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  myBubble: {
    backgroundColor: ChatColors.sentBubble,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: ChatColors.receivedBubble,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  theirMessageText: {
    color: ChatColors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  myTimestamp: {
    color: ChatColors.textSecondary,
  },
  theirTimestamp: {
    color: ChatColors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: Spacing.xl,
    opacity: 0.9,
  },
  emptyTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: "600",
    color: ChatColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.body.fontSize,
    color: ChatColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    backgroundColor: ChatColors.surface,
    borderTopWidth: 1,
    borderTopColor: ChatColors.border,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: ChatColors.background,
    borderRadius: BorderRadius.lg,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    color: ChatColors.textPrimary,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ChatColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: ChatColors.receivedBubble,
  },
});
