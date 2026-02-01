import { Platform } from "react-native";

export const CalculatorColors = {
  background: "#FFFFFF",
  display: "#F5F5F5",
  buttons: "#E0E0E0",
  operators: "#FF9800",
  operatorText: "#FFFFFF",
  text: "#212121",
  buttonPressed: "#D0D0D0",
};

export const ChatColors = {
  primary: "#6B4E8E",
  background: "#F9F7FC",
  surface: "#FFFFFF",
  sentBubble: "#6B4E8E",
  receivedBubble: "#E8E0F0",
  textPrimary: "#2D2D2D",
  textSecondary: "#757575",
  accent: "#A78BCC",
  border: "#E0D8EC",
  inputBackground: "#FFFFFF",
};

const tintColorLight = "#6B4E8E";
const tintColorDark = "#A78BCC";

export const Colors = {
  light: {
    text: "#2D2D2D",
    buttonText: "#FFFFFF",
    tabIconDefault: "#757575",
    tabIconSelected: tintColorLight,
    link: "#6B4E8E",
    backgroundRoot: "#F9F7FC",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F0EBF5",
    backgroundTertiary: "#E8E0F0",
  },
  dark: {
    text: "#ECEDEE",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    link: "#A78BCC",
    backgroundRoot: "#1A1520",
    backgroundDefault: "#2A2435",
    backgroundSecondary: "#352F45",
    backgroundTertiary: "#453E55",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  calculatorDisplay: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "400" as const,
  },
  calculatorButton: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "500" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
