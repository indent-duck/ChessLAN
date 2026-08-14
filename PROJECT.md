# ChessLAN — Project Context

## What it is
A React Native (Expo ~54) mobile chess app for **true local network multiplayer** between two phones on the same WiFi - **no external server required**.

## Tech Stack
- React Native 0.81.5 / Expo ~54
- TypeScript
- React Navigation (native stack)
- react-native-svg + react-native-svg-transformer (SVG pieces and icons)
- Fonts: GoogleSansFlex (400, 500, 700), ArchivoBlack
- **Local networking:** react-native-tcp-socket, react-native-udp
- **Server:** Embedded TCP server runs on host phone (port 3001)

## Architecture
### Local Multiplayer Flow:
1. **Host phone** starts embedded TCP server on port 3001
2. **Host phone** generates 4-character room code
3. **Guest phone** enters room code and host's IP (configured in Settings)
4. **Guest phone** connects to host via TCP socket
5. Both phones exchange game messages directly over local WiFi

### Key Files:
- `hooks/useLocalServer.ts` - Embedded TCP server for host (React Native)
- `hooks/useLocalClient.ts` - TCP client for guest

## Navigation Flow
```
Home → SelectMode → HostGame → GameRoom
                  → JoinGame → GameRoom
       CustomTime → SelectMode (for custom time only)
```
- Home: username input (editable inline), horizontal scrollable card carousel to pick game mode, Settings and About buttons
- SelectMode: choose variant (Standard/Chess960) and start hosting
- CustomTime: pick minutes (1–30) + increment (0–30s), navigates to SelectMode with custom time string (only for Custom mode)
- HostGame: starts local server, shows room code, wait for guest, pick color (swap toggle), Start Game → GameRoom
- JoinGame: enter 4-character room code, connects to host, wait for start → GameRoom
- GameRoom: full chess gameplay with real-time multiplayer sync

## Screen-by-screen notes

### Home (`screens/Home.tsx`)
- Username stored in AsyncStorage, editable with inline TextInput + check/edit icon
- Game modes: Rapid (10 min), Blitz (5 min), Bullet (1 min), Custom
- FlatList carousel with snap, scale + opacity spring animations on active card
- Dot indicators below carousel
- **Settings button** - Configure host IP for guest connections
- **About button** - Shows modal with creator credits (Lee Johnrich H. Ramirez, CvSU)
- Footer shows "ChessLAN v1.0.0"

### SelectMode (`screens/SelectMode.tsx`)
- Receives `mode`, `time`, `username` as route params
- **Variant selection:** Standard or Chess960 with toggle buttons
- Standard: Traditional chess starting position
- Chess960: Fischer Random Chess with randomized back rank
- Shows variant description when Chess960 is selected
- Start Hosting button navigates to HostGame with selected variant
- Slide-up + fade-in panel animation on mount, reverse on back

### HostGame (`screens/HostGame.tsx`)
- Receives `mode`, `time`, `username`, `variant` (standard or chess960)
- **Starts embedded TCP server** on port 3001 using `useLocalServer` hook
- **Chess960 FEN generation:** If variant is chess960, generates random starting position
- Generates 4-character room code automatically
- `flipped` state toggles which color the host plays
- Displays room code and waits for guest to join
- Shows opponent username when guest connects
- Shows Chess960 badge if variant is chess960
- Start Game navigates to GameRoom with `{ mode, time, username, flipped, variant, chess960Fen, isHost: true }`
- **Server runs on this phone** - no external server needed

### JoinGame (`screens/JoinGame.tsx`)
- Receives `username`
- **Connects to host phone** via TCP using `useLocalClient` hook
- 4-char uppercase room code input
- Reads host IP from Settings (ws://192.168.x.x:3001)
- Join button disabled until 4 chars entered
- Shows error feedback for invalid codes or connection failures
- Receives game info from host (mode, time, variant)
- Waits for host to start game

### CustomTime (`screens/CustomTime.tsx`)
- Chip selectors for minutes [1,2,3,5,10,15,20,30] and increment [0,1,2,3,5,10,15,30]
- Formats time as `"X min"` or `"X+Y"` (with increment)
- Navigates to SelectMode (skips HostGame/JoinGame choice)

### GameRoom (`screens/GameRoom.tsx`)
- Receives `mode`, `time`, `username`, `flipped`, `myColor`, `opponentUsername`, `variant`, `chess960Fen`, `isHost`
- **`isHost: true`** - Uses `useLocalServer` to receive moves from guest
- **`isHost: false`** - Uses `useLocalClient` to receive moves from host
- **Chess960 support:** Initializes board with custom FEN if provided
- `chess.js` `Chess` instance in ref is source of truth for board state
- `board` state derived from `chess.board()` after each move
- Tapping own piece shows legal moves, tapping legal square executes move
- Selected square highlighted in yellow
- **Promotion UI:** Modal with piece selection (Queen, Rook, Bishop, Knight)
- **Move syncing:** Moves sent via `sendNetworkMessage()` to opponent
- **Move receiving:** Opponent moves received via `addNetworkListener()`
- Per-player countdown timers with increment support
- Timeout, checkmate, draw, resignation all synchronized
- Board flip support via `flipped` param
- **Resign:** Syncs via network to opponent
- **Draw offers:** Sent/received via network with 10-second timer
- **Abandon:** Notifies opponent via network

### GameCard (`components/GameCard.tsx`)
- Card in the Home carousel
- "Play Now" → navigates to CustomTime (if Custom) or SelectMode

## What's NOT done yet
- UDP broadcasting for automatic host discovery (currently requires manual IP entry)
- Reconnection handling if connection drops mid-game
- Move sound effects
- Vibration on captures
- Game chat functionality

## Dependencies
```json
{
  "react-native-tcp-socket": "^6.0.6",
  "react-native-udp": "^4.1.7",
  "expo-splash-screen": "~31.0.13",
  "chess.js": "^1.4.0",
  "@react-native-async-storage/async-storage": "2.2.0",
  "@react-navigation/native": "^6.1.18",
  "react-native-svg": "15.12.1"
}
```

## What IS done
- Embedded TCP server runs on host phone (port 3001)
- Guest connects to host via TCP socket
- Room code generation (4 characters) and validation
- Opponent discovery and connection status
- Color selection sync between devices
- Game start coordination
- **Chess960 variant** with FEN generation and synchronization
- **Promotion UI** with piece selection modal
- **Real-time move synchronization** between phones
- **Resign, draw offers, draw accept/decline** synchronized
- **Game over states** (checkmate, timeout, resignation, draw) synchronized
- Full chess UI with legal moves, captures, timers
- Settings panel for configuring host IP address
- Connection error handling and user feedback
- About modal with creator credits (Lee Johnrich H. Ramirez, BS Information Technology, CvSU)
- App renamed to ChessLAN (Local Area Network chess)
- Splash screen with expo-splash-screen integration
- Loading states and connection status indicators
- **Complete local WiFi multiplayer** - no external server needed

## Testing

### Development Build (Recommended)
Expo Go **does not work** because it doesn't support custom native modules (`react-native-tcp-socket`).

**Build development client:**
```bash
eas build --profile development --platform android
```

**Install on both test phones**, then:
```bash
npx expo start --dev-client
```

**Benefits:**
- Fast iteration with hot reload
- Console logs visible
- Native modules included
- Real device testing

### Production Build
```bash
eas build --profile preview --platform android
```
Most realistic test but slow iteration (rebuild for each change).

### What to Keep/Remove
**Must keep (actively used):**
- `hooks/useLocalServer.ts` - Host TCP server
- `hooks/useLocalClient.ts` - Guest TCP client
- `config.ts` - Server URL configuration
- `PROJECT.md` - Main documentation
- `README.md` - Project overview
- All screen files and components

**Can be safely deleted (legacy/unused):**
- `hooks/useSocket.ts` - Old WebSocket client (not imported anywhere)

Note: No external documentation files exist (SERVER_SETUP.md, TESTING_CHECKLIST.md, etc.) - they were already removed.

## Design language
- Background: `#f5f5f0` (off-white) for pre-game screens, `#333638` (dark) for GameRoom
- Primary green: `#1e6b40`
- Light square: `#f0d9b5`, dark square: `#b58863` (classic chess.com palette)
- Rounded panels slide up from bottom with spring animation on most screens
- Font: GoogleSansFlex throughout
