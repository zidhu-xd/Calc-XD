import React, { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { CalculatorColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import * as Storage from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BUTTON_GAP = 12;
const BUTTON_SIZE = (SCREEN_WIDTH - BUTTON_GAP * 5) / 4;

type ButtonType = "number" | "operator" | "function" | "equals" | "clear" | "backspace";

type CalculatorButton = {
  label: string;
  type: ButtonType;
  value: string;
  icon?: string;
};

const BUTTONS: CalculatorButton[][] = [
  [
    { label: "AC", type: "clear", value: "AC" },
    { label: "()", type: "function", value: "()" },
    { label: "%", type: "operator", value: "%" },
    { label: "\u00F7", type: "operator", value: "/" },
  ],
  [
    { label: "7", type: "number", value: "7" },
    { label: "8", type: "number", value: "8" },
    { label: "9", type: "number", value: "9" },
    { label: "\u00D7", type: "operator", value: "*" },
  ],
  [
    { label: "4", type: "number", value: "4" },
    { label: "5", type: "number", value: "5" },
    { label: "6", type: "number", value: "6" },
    { label: "-", type: "operator", value: "-" },
  ],
  [
    { label: "1", type: "number", value: "1" },
    { label: "2", type: "number", value: "2" },
    { label: "3", type: "number", value: "3" },
    { label: "+", type: "operator", value: "+" },
  ],
  [
    { label: "0", type: "number", value: "0" },
    { label: ".", type: "number", value: "." },
    { label: "backspace", type: "backspace", value: "backspace", icon: "delete" },
    { label: "=", type: "equals", value: "=" },
  ],
];

interface CalcButtonProps {
  button: CalculatorButton;
  onPress: () => void;
}

function CalcButton({ button, onPress }: CalcButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const getButtonStyle = () => {
    switch (button.type) {
      case "operator":
        return styles.operatorButton;
      case "equals":
        return styles.equalsButton;
      case "clear":
        return styles.clearButton;
      case "function":
        return styles.operatorButton;
      case "backspace":
        return styles.numberButton;
      default:
        return styles.numberButton;
    }
  };

  const getTextStyle = () => {
    switch (button.type) {
      case "equals":
        return styles.equalsText;
      case "clear":
        return styles.clearText;
      default:
        return styles.buttonText;
    }
  };

  return (
    <Animated.View style={[styles.buttonWrapper, animatedStyle]}>
      <Pressable
        style={[styles.button, getButtonStyle()]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`calc-button-${button.label}`}
      >
        {button.icon ? (
          <Feather name="delete" size={24} color={CalculatorColors.text} />
        ) : (
          <Text style={[styles.buttonLabel, getTextStyle()]}>{button.label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { unlock, isSetupComplete, isPaired } = useApp();

  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [secretCode, setSecretCode] = useState("");

  const getDisplayOperator = (op: string): string => {
    switch (op) {
      case "*": return "\u00D7";
      case "/": return "\u00F7";
      default: return op;
    }
  };

  const evaluateExpression = (expr: string): string => {
    try {
      if (!expr) return "0";
      const sanitized = expr.replace(/\u00D7/g, "*").replace(/\u00F7/g, "/");
      const calculated = Function(`'use strict'; return (${sanitized})`)();
      if (isNaN(calculated) || !isFinite(calculated)) return "0";
      const resultStr = String(calculated);
      if (resultStr.includes(".") && resultStr.split(".")[1].length > 8) {
        return calculated.toFixed(8).replace(/\.?0+$/, "");
      }
      return resultStr;
    } catch {
      return "0";
    }
  };

  const checkSecretCode = useCallback(async (code: string) => {
    if (code.length === 4) {
      const isValid = await Storage.verifyUnlockCode(code);
      if (isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        unlock();
        setSecretCode("");
        if (isPaired) {
          navigation.navigate("Chat");
        } else {
          navigation.navigate("Pairing");
        }
      } else {
        setSecretCode("");
      }
    }
  }, [unlock, isPaired, navigation]);

  const handleNumberPress = useCallback((value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!isSetupComplete) {
      const newCode = secretCode + value;
      setSecretCode(newCode);
      if (newCode.length === 4) {
        navigation.navigate("Setup", { code: newCode });
        setSecretCode("");
        return;
      }
    } else {
      const newCode = secretCode + value;
      setSecretCode(newCode);
      checkSecretCode(newCode);
    }

    if (value === "." && expression.includes(".")) {
      const lastOperatorIndex = Math.max(
        expression.lastIndexOf("+"),
        expression.lastIndexOf("-"),
        expression.lastIndexOf("*"),
        expression.lastIndexOf("/")
      );
      const lastNumber = expression.slice(lastOperatorIndex + 1);
      if (lastNumber.includes(".")) return;
    }

    const newExpr = expression + value;
    setExpression(newExpr);
    setResult(evaluateExpression(newExpr));
  }, [expression, secretCode, isSetupComplete, checkSecretCode, navigation]);

  const handleOperatorPress = useCallback((op: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSecretCode("");

    if (!expression) return;

    const lastChar = expression.slice(-1);
    const operators = ["+", "-", "*", "/", "%"];
    
    if (operators.includes(lastChar)) {
      const newExpr = expression.slice(0, -1) + op;
      setExpression(newExpr);
    } else {
      const newExpr = expression + op;
      setExpression(newExpr);
    }
  }, [expression]);

  const handleEqualsPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSecretCode("");

    if (expression) {
      const finalResult = evaluateExpression(expression);
      setExpression(finalResult);
      setResult(finalResult);
    }
  }, [expression]);

  const handleClearPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSecretCode("");
    setExpression("");
    setResult("0");
  }, []);

  const handleBackspacePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSecretCode("");
    
    if (expression.length > 0) {
      const newExpr = expression.slice(0, -1);
      setExpression(newExpr);
      setResult(newExpr ? evaluateExpression(newExpr) : "0");
    }
  }, [expression]);

  const handleButtonPress = useCallback((button: CalculatorButton) => {
    switch (button.type) {
      case "number":
        handleNumberPress(button.value);
        break;
      case "operator":
        handleOperatorPress(button.value);
        break;
      case "equals":
        handleEqualsPress();
        break;
      case "clear":
        handleClearPress();
        break;
      case "backspace":
        handleBackspacePress();
        break;
      case "function":
        break;
    }
  }, [handleNumberPress, handleOperatorPress, handleEqualsPress, handleClearPress, handleBackspacePress]);

  const formatExpression = (expr: string): string => {
    return expr
      .replace(/\*/g, "\u00D7")
      .replace(/\//g, "\u00F7");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.displayContainer}>
        <Text
          style={styles.expression}
          numberOfLines={1}
          adjustsFontSizeToFit
          testID="calc-expression"
        >
          {formatExpression(expression) || "0"}
        </Text>
        {expression.length > 0 && (
          <Text
            style={styles.result}
            numberOfLines={1}
            adjustsFontSizeToFit
            testID="calc-display"
          >
            {result}
          </Text>
        )}
      </View>

      <View style={[styles.buttonsContainer, { paddingBottom: insets.bottom + 20 }]}>
        {BUTTONS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((button, buttonIndex) => (
              <CalcButton
                key={buttonIndex}
                button={button}
                onPress={() => handleButtonPress(button)}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CalculatorColors.background,
  },
  displayContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  expression: {
    fontSize: 56,
    fontWeight: "300",
    color: CalculatorColors.text,
    textAlign: "right",
  },
  result: {
    fontSize: 32,
    fontWeight: "400",
    color: CalculatorColors.textSecondary,
    textAlign: "right",
    marginTop: 8,
  },
  buttonsContainer: {
    paddingHorizontal: BUTTON_GAP,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: BUTTON_GAP,
  },
  buttonWrapper: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  button: {
    flex: 1,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  numberButton: {
    backgroundColor: CalculatorColors.numberButton,
  },
  operatorButton: {
    backgroundColor: CalculatorColors.operatorButton,
  },
  clearButton: {
    backgroundColor: CalculatorColors.functionButton,
  },
  equalsButton: {
    backgroundColor: CalculatorColors.equalsButton,
  },
  buttonLabel: {
    fontSize: 28,
    fontWeight: "400",
  },
  buttonText: {
    color: CalculatorColors.text,
  },
  clearText: {
    color: CalculatorColors.text,
  },
  equalsText: {
    color: "#1C1C1C",
  },
});
