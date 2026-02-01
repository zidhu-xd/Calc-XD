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

import { CalculatorColors, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import * as Storage from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BUTTON_MARGIN = 8;
const BUTTON_SIZE = (SCREEN_WIDTH - BUTTON_MARGIN * 10) / 4;

type CalculatorButton = {
  label: string;
  type: "number" | "operator" | "function" | "equals";
  value: string;
};

const BUTTONS: CalculatorButton[][] = [
  [
    { label: "C", type: "function", value: "C" },
    { label: "+/-", type: "function", value: "+/-" },
    { label: "%", type: "function", value: "%" },
    { label: "/", type: "operator", value: "/" },
  ],
  [
    { label: "7", type: "number", value: "7" },
    { label: "8", type: "number", value: "8" },
    { label: "9", type: "number", value: "9" },
    { label: "x", type: "operator", value: "*" },
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
    { label: "=", type: "equals", value: "=" },
  ],
];

interface CalcButtonProps {
  button: CalculatorButton;
  onPress: () => void;
  isWide?: boolean;
}

function CalcButton({ button, onPress, isWide }: CalcButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const getButtonStyle = () => {
    switch (button.type) {
      case "operator":
      case "equals":
        return styles.operatorButton;
      case "function":
        return styles.functionButton;
      default:
        return styles.numberButton;
    }
  };

  const getTextStyle = () => {
    switch (button.type) {
      case "operator":
      case "equals":
        return styles.operatorText;
      default:
        return styles.buttonText;
    }
  };

  return (
    <Animated.View
      style={[
        styles.buttonWrapper,
        isWide ? styles.wideButton : null,
        animatedStyle,
      ]}
    >
      <Pressable
        style={[styles.button, getButtonStyle()]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`calc-button-${button.label}`}
      >
        <Text style={[styles.buttonLabel, getTextStyle()]}>{button.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { unlock, isSetupComplete, isPaired } = useApp();

  const [display, setDisplay] = useState("0");
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  const [secretCode, setSecretCode] = useState("");

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

    if (waitingForSecondOperand) {
      setDisplay(value);
      setWaitingForSecondOperand(false);
    } else {
      if (value === "." && display.includes(".")) return;
      setDisplay(display === "0" && value !== "." ? value : display + value);
    }
  }, [display, waitingForSecondOperand, secretCode, isSetupComplete, checkSecretCode, navigation]);

  const handleOperatorPress = useCallback((op: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSecretCode("");

    const inputValue = parseFloat(display);

    if (firstOperand === null) {
      setFirstOperand(inputValue);
    } else if (operator) {
      const result = calculate(firstOperand, inputValue, operator);
      setDisplay(String(result));
      setFirstOperand(result);
    }

    setOperator(op);
    setWaitingForSecondOperand(true);
  }, [display, firstOperand, operator]);

  const calculate = (first: number, second: number, op: string): number => {
    switch (op) {
      case "+":
        return first + second;
      case "-":
        return first - second;
      case "*":
        return first * second;
      case "/":
        return second !== 0 ? first / second : 0;
      default:
        return second;
    }
  };

  const handleEqualsPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSecretCode("");

    if (operator && firstOperand !== null) {
      const secondOperand = parseFloat(display);
      const result = calculate(firstOperand, secondOperand, operator);
      setDisplay(String(result));
      setFirstOperand(null);
      setOperator(null);
      setWaitingForSecondOperand(false);
    }
  }, [display, firstOperand, operator]);

  const handleFunctionPress = useCallback((func: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSecretCode("");

    switch (func) {
      case "C":
        setDisplay("0");
        setFirstOperand(null);
        setOperator(null);
        setWaitingForSecondOperand(false);
        break;
      case "+/-":
        setDisplay(String(parseFloat(display) * -1));
        break;
      case "%":
        setDisplay(String(parseFloat(display) / 100));
        break;
    }
  }, [display]);

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
      case "function":
        handleFunctionPress(button.value);
        break;
    }
  }, [handleNumberPress, handleOperatorPress, handleEqualsPress, handleFunctionPress]);

  const formatDisplay = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return "0";
    if (value.length > 12) {
      return num.toExponential(5);
    }
    return value;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.displayContainer}>
        <Text
          style={styles.display}
          numberOfLines={1}
          adjustsFontSizeToFit
          testID="calc-display"
        >
          {formatDisplay(display)}
        </Text>
      </View>

      <View style={[styles.buttonsContainer, { paddingBottom: insets.bottom + 16 }]}>
        {BUTTONS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((button, buttonIndex) => (
              <CalcButton
                key={buttonIndex}
                button={button}
                onPress={() => handleButtonPress(button)}
                isWide={button.label === "0"}
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
    paddingBottom: 20,
    backgroundColor: CalculatorColors.display,
  },
  display: {
    fontSize: Typography.calculatorDisplay.fontSize,
    fontWeight: Typography.calculatorDisplay.fontWeight,
    color: CalculatorColors.text,
    textAlign: "right",
  },
  buttonsContainer: {
    paddingHorizontal: BUTTON_MARGIN,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: BUTTON_MARGIN,
  },
  buttonWrapper: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    marginHorizontal: BUTTON_MARGIN / 2,
  },
  wideButton: {
    width: BUTTON_SIZE * 2 + BUTTON_MARGIN,
  },
  button: {
    flex: 1,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  numberButton: {
    backgroundColor: CalculatorColors.buttons,
  },
  operatorButton: {
    backgroundColor: CalculatorColors.operators,
  },
  functionButton: {
    backgroundColor: "#D4D4D2",
  },
  buttonLabel: {
    fontSize: Typography.calculatorButton.fontSize,
    fontWeight: Typography.calculatorButton.fontWeight,
  },
  buttonText: {
    color: CalculatorColors.text,
  },
  operatorText: {
    color: CalculatorColors.operatorText,
  },
});
