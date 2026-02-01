# Design Guidelines: Hidden Messenger (Calculator Disguise)

## Brand Identity

**Purpose**: Enable private couple communication disguised as a standard calculator app.

**Dual Personality**:
- **Calculator Mode** (Public Face): Deliberately boring, unremarkable, generic. Should blend in with system apps - no personality, no memorable elements. Think budget office calculator.
- **Chat Mode** (Private Space): Warm, intimate, secure-feeling. Soft colors, gentle animations, emphasis on privacy and trust. Think cozy, protected space.

**Memorable Element**: The seamless instant transition between mundane and intimate - the feeling of a secret world hidden in plain sight.

## Navigation Architecture

**Root Navigation**: Stack-only (no tabs, no drawer)

**Screens**:
1. **Calculator** (always root) - Fully functional calculator
2. **Pairing Setup** (modal) - Generate or join with pairing code
3. **Chat** (replaces calculator) - WhatsApp-style messaging interface
4. **Media Viewer** (modal) - Full-screen image/video viewer
5. **Voice Call** (modal) - Audio calling interface
6. **Video Call** (modal) - Video calling interface
7. **Settings** (accessible from chat) - 4-digit code change, unpair option

## Screen Specifications

### Calculator Screen
- **Purpose**: Primary disguise; unlock gateway when correct code entered
- **Layout**:
  - No header (full screen calculator)
  - Display area at top (showing numbers/results)
  - 4x4 grid of calculator buttons below
  - Standard Android calculator appearance (Material Design)
- **Components**: Calculator display, number buttons (0-9), operators (+, -, ×, ÷), equals, clear, decimal
- **Behavior**: When correct 4-digit code entered on keypad, silently navigate to Pairing/Chat without animation
- **Safe Area**: None (full screen)

### Pairing Setup Screen
- **Purpose**: First-time setup - generate or join pairing code
- **Layout**:
  - Simple header: "Setup" with back button → returns to calculator
  - Centered vertical content (scrollable)
  - Two large buttons: "Generate Code" and "Join with Code"
- **Components**: 
  - Large 6-digit pairing code display (after generation)
  - Text input for entering code (when joining)
  - Submit button
- **Safe Area**: Top: insets.top + 16dp, Bottom: insets.bottom + 16dp

### Chat Screen
- **Purpose**: Main messaging interface after unlock
- **Layout**:
  - Header: Partner name/avatar, video call icon, voice call icon, settings icon
  - Message list (inverted FlatList, newest at bottom)
  - Bottom input bar: attachment button, text input, send button
- **Components**: Message bubbles (sent/received), timestamp labels, delivery status indicators, typing indicator
- **Empty State**: Illustration showing locked heart or couple silhouette with text "Your private space. Start chatting."
- **Safe Area**: Top: 16dp, Bottom: insets.bottom + 16dp

### Voice/Video Call Screens
- **Purpose**: Real-time calling interface
- **Layout**:
  - Full screen with caller/receiver name and avatar
  - Call controls at bottom (mute, speaker, end call)
  - For video: full screen video with floating self-preview
- **Components**: Avatar (audio only), video streams, floating controls
- **Safe Area**: Top: insets.top + 24dp, Bottom: insets.bottom + 24dp

### Settings Screen
- **Purpose**: Change unlock code, unpair, exit
- **Layout**:
  - Standard Material header with back button
  - Scrollable list: "Change 4-Digit Code", "Unpair Device", "Lock & Exit"
- **Safe Area**: Top: 16dp, Bottom: insets.bottom + 16dp

## Color Palette

**Calculator Mode** (Intentionally generic):
- Background: #FFFFFF
- Display: #F5F5F5
- Buttons: #E0E0E0
- Accent (operators): #FF9800
- Text: #212121

**Chat Mode** (Warm, intimate):
- Primary: #6B4E8E (deep purple - trust, intimacy)
- Background: #F9F7FC (very soft purple tint)
- Surface: #FFFFFF
- Sent Bubble: #6B4E8E
- Received Bubble: #E8E0F0
- Text Primary: #2D2D2D
- Text Secondary: #757575
- Accent: #A78BCC (lighter purple for icons)

## Typography

**Calculator**: Roboto (Android system default)
- Display: 48sp Regular
- Buttons: 24sp Medium

**Chat**: Nunito (Google Font - friendly, approachable)
- Partner Name: 20sp Bold
- Message Text: 16sp Regular
- Timestamps: 12sp Regular
- Input: 16sp Regular

## Visual Design

- **Calculator Mode**: Zero personality. Standard Material ripple effects only. No shadows except button elevation (2dp).
- **Chat Mode**: Soft, rounded corners (16dp for bubbles, 24dp for input bar). Subtle shadows on floating elements (4dp elevation). Gentle fade-in animations for messages.
- **Icons**: Material Icons for all UI elements
- **Transitions**: Instant cut to calculator on lock (no animation). Smooth fade when unlocking.

## Assets to Generate

1. **app-icon.png** - Looks like generic calculator icon (calculator graphic on solid background) - Device home screen
2. **splash-icon.png** - Same calculator icon - App launch
3. **empty-chat.png** - Illustration of locked heart or couple silhouette holding hands - Chat screen empty state
4. **pairing-illustration.png** - Two phones with connecting dotted line - Pairing setup screen
5. **default-avatar.png** - Simple circular placeholder avatar (initials on soft background) - Chat header, call screens

**Image Quality**: Keep illustrations minimal and icon-like. Avoid detailed graphics that draw attention. Calculator icon must look utterly ordinary.