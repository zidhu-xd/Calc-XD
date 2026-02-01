# Calculator (Hidden Messenger)

## Overview
A secret messaging app for couples disguised as a fully functional calculator. The app looks and works exactly like a real calculator, but entering a 4-digit secret code unlocks a private chat space.

## Current State
- **Version**: MVP 1.0
- **Status**: Functional calculator with hidden chat feature

## Features Implemented

### Calculator Mode (Disguise)
- Fully functional calculator with all basic operations (+, -, ×, ÷)
- Standard calculator UI that blends in with system apps
- Percentage and sign toggle functions
- Large display with proper formatting

### Secret Access
- 4-digit code entry via calculator keypad
- First-time setup flow to create unlock code
- Instant lock when app goes to background

### Pairing System
- Generate 6-character pairing code
- Join with partner's code
- Copy code to clipboard

### Chat Interface
- WhatsApp-style chat UI
- Message bubbles with timestamps
- Empty state illustration
- Soft purple theme for intimate feel

### Settings
- Change unlock code
- View pairing code
- Unpair device (with confirmation)
- Lock & exit

## Architecture

### Frontend (React Native + Expo)
- **Screens**: Calculator, Setup, Pairing, Chat, Settings
- **Context**: AppContext for global state management
- **Storage**: AsyncStorage for messages, SecureStore for unlock code

### Backend (Express.js)
- Basic server setup (ready for future sync features)

## Key Files
- `client/screens/CalculatorScreen.tsx` - Main calculator/disguise
- `client/screens/ChatScreen.tsx` - Messaging interface
- `client/context/AppContext.tsx` - App state management
- `client/lib/storage.ts` - Local storage utilities

## Privacy Features
- App locks instantly when backgrounded
- No visible traces in calculator mode
- Messages stored locally only

## Next Phase Features (Not Yet Implemented)
- Real-time message sync between devices
- Image/video/audio sharing
- Voice and video calling (WebRTC)
- Push notifications with generic text
- End-to-end encryption

## User Preferences
- Minimal, native-looking calculator UI
- Warm purple theme for chat mode
- Haptic feedback on interactions

## Recent Changes
- Initial MVP implementation
- Calculator disguise with working calculations
- Pairing system with code generation
- Basic chat messaging (local only)
