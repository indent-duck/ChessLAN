# ChessLAN

A React Native chess app for **true local network multiplayer** - play chess with a friend over WiFi without needing internet or an external server!

![Version](https://img.shields.io/badge/version-2.0.1-blue)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## Features

### Gameplay

- **Full chess implementation** with legal move validation
- **Multiple time controls:** Rapid (10 min), Blitz (5 min), Bullet (1 min), Custom
- **Increment support** (e.g., 5+3, 3+2)
- **Chess960 variant** (Fischer Random Chess) with randomized starting positions
- **Promotion UI** with piece selection (Queen, Rook, Bishop, Knight)
- **Board flip** - play as White or Black
- **Game end conditions:** Checkmate, timeout, resignation, draw

### Local Network Multiplayer

- **2-phone gameplay** - no laptop or cloud server needed
- **Dual connection modes:** WiFi Network or Phone Hotspot
- **100% local** - works over WiFi or hotspot without internet
- **Privacy first** - no data leaves your network
- **Low latency** - direct device-to-device communication
- **Free hosting** - no server costs
- **Automatic IP display** - host's IP shown automatically
- **Simplified setup** - just enter IP numbers, no complex URLs

### User Experience

- **Clean, modern UI** with smooth animations
- **Custom usernames**
- **Connection mode selection** - choose WiFi or Hotspot
- **Easy setup** - IP displayed automatically for host
- **Simple IP entry** - just numbers, no complex URLs
- **Simple room codes** - 4 characters to join
- **Real-time sync** - moves appear instantly
- **Move history** with scrollable list

## How It Works

### WiFi Network Mode

```
┌─────────────────────┐         ┌─────────────────────┐
│   Host Phone        │         │   Guest Phone       │
│                     │         │                     │
│  TCP Server :3001   │◄───────►│  TCP Client         │
│  Room Code: AB12    │  WiFi   │  Connects to Host IP│
│  IP: 192.168.1.100  │         │                     │
└─────────────────────┘         └─────────────────────┘
```

### Phone Hotspot Mode

```
┌─────────────────────┐         ┌─────────────────────┐
│   Host Phone        │         │   Guest Phone       │
│                     │         │                     │
│  Hotspot Active     │◄───────►│  Connected to       │
│  TCP Server :3001   │ Hotspot │  Host's Hotspot     │
│  Room Code: AB12    │         │                     │
│  IP: 192.168.43.1   │         │                     │
└─────────────────────┘         └─────────────────────┘
```

**Setup Steps:**

1. Host opens app and selects connection mode (WiFi or Hotspot)
2. Host creates a game and starts TCP server on port 3001
3. Host shares room code and IP address (displayed automatically)
4. Guest selects same connection mode
5. Guest enters host's IP in simple format (e.g., 192.168.1.100)
6. Guest joins using the room code
7. Both players see each other and play in real-time

## Tech Stack

- **Frontend:** React Native 0.81.5 with Expo SDK 54
- **Language:** TypeScript
- **Navigation:** React Navigation (native stack)
- **Chess Logic:** chess.js
- **Networking:** react-native-tcp-socket (direct P2P)
- **Graphics:** react-native-svg for chess pieces
- **Fonts:** Google Sans Flex, Archivo Black

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/ChessLAN.git
cd ChessLAN

# Install dependencies
npm install

# Start development server
npx expo start
```

### Building APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for Android
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios --profile preview
```

## Usage

### For Players

**Quick Start (WiFi Network Mode):**

1. Install ChessLAN on 2 phones
2. Connect both to same WiFi network
3. Both select "Same WiFi Network" mode
4. Host creates game, sees room code and IP
5. Guest configures host's IP (just the numbers)
6. Guest joins with room code
7. Play chess

**Quick Start (Hotspot Mode):**

1. Install ChessLAN on 2 phones
2. Host turns on phone hotspot
3. Guest connects to host's hotspot in phone settings
4. Both select "Phone Hotspot" mode
5. Host creates game, sees room code and IP
6. Guest configures host's hotspot IP (usually 192.168.43.1 or 172.20.10.1)
7. Guest joins with room code
8. Play chess

### For Developers

See [PROJECT.md](PROJECT.md) for architecture details.

**Key Files:**

- `screens/ConnectionTypeSelect.tsx` - Connection mode selection
- `screens/HomeWiFi.tsx` - WiFi mode lobby
- `screens/HomeHotspot.tsx` - Hotspot mode lobby
- `components/IPConfigModal.tsx` - IP configuration modal
- `utils/networkUtils.ts` - Network utility functions
- `hooks/useLocalServer.ts` - Embedded TCP server (host)
- `hooks/useLocalClient.ts` - TCP client (guest)
- `screens/HostGame.tsx` - Host game creation with IP display
- `screens/JoinGame.tsx` - Guest game joining
- `screens/GameRoom.tsx` - Chess gameplay

## Testing

**Development Build (Recommended)**

Expo Go does not work because it doesn't support custom native modules (`react-native-tcp-socket`).

Build development client:

```bash
eas build --profile development --platform android
```

Install on both test phones, then:

```bash
npx expo start --dev-client
```

**Benefits:**

- Fast iteration with hot reload
- Console logs visible
- Native modules included
- Real device testing

**Production Build:**

```bash
eas build --profile preview --platform android
```

Most realistic test but slow iteration (rebuild for each change).

## Architecture

### Local Networking

- **Host:** Runs embedded TCP server on port 3001
- **Guest:** Connects as TCP client to host's IP
- **Protocol:** JSON messages over TCP with newline delimiters
- **Messages:** moves, game state, resign, draw offers, etc.

### Message Types

```typescript
// Guest to Host
{ type: "join", code: "AB12", username: "Player" }
{ type: "move", move: { from: "e2", to: "e4", promotion: "q" } }
{ type: "resign" | "draw_offer" | "draw_accept" | "leave" }

// Host to Guest
{ type: "joined", hostUsername, mode, time, variant }
{ type: "color_update", flipped: boolean }
{ type: "game_start", flipped, variant }
{ type: "move", move: {...} }
{ type: "error", message: "Room not found" }
```

## Project Structure

```
ChessLAN/
├── screens/           # UI screens
│   ├── Home.tsx       # Game mode selection
│   ├── SelectMode.tsx # Variant selection (Standard/Chess960)
│   ├── HostGame.tsx   # Create & host game
│   ├── JoinGame.tsx   # Join existing game
│   ├── GameRoom.tsx   # Chess gameplay
│   └── ...
├── hooks/             # React hooks
│   ├── useLocalServer.ts   # Host TCP server
│   └── useLocalClient.ts   # Guest TCP client
├── components/        # Reusable components
├── assets/            # Images, SVGs, fonts
└── types/             # TypeScript definitions
```

## Roadmap

### v1.2 (Planned)

- UDP broadcast for auto host discovery
- Reconnection handling
- Move sound effects
- Haptic feedback

## Known Limitations

- **No Reconnection:** Connection loss ends the game
- **Host Dependency:** If host quits, game ends
- **IPv6 Not Supported:** Only IPv4 addresses work (filtered automatically)

These are inherent to the peer-to-peer architecture and prioritize privacy/local play.

## Troubleshooting

### "Failed to connect to host"

- Ensure both phones selected the same connection mode
- **WiFi Mode:** Both phones must be on same WiFi network
- **Hotspot Mode:** Guest must be connected to host's hotspot
- Verify host's IP address is correct (format: 192.168.1.100)
- Check firewall not blocking port 3001
- Ensure host has started hosting before guest tries to join

### "Unable to detect IP" on Host Screen

- Check your network connection
- The app filters out IPv6 addresses (starting with 2001:, fe80:, etc.)
- Make sure you're connected to WiFi or have hotspot enabled
- Try toggling WiFi/hotspot off and on

### "Room not found"

- Verify room code is correct (case-sensitive)
- Ensure host is still on the hosting screen
- Try creating a new room and using the new code

### Connection drops during game

- Keep phones unlocked during gameplay
- Stay within good WiFi range
- Check neither phone switched networks

## Credits

**Created by:** Lee Johnrich H. Ramirez  
**Program:** BS in Information Technology  
**University:** Cavite State University - Main

Built with React Native for personal use and to keep me and my friends playing without needing an internet connection.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Chess piece SVGs from [chess.com](https://chess.com)
- Chess logic powered by [chess.js](https://github.com/jhlywa/chess.js)
- Networking via [react-native-tcp-socket](https://github.com/Rapsssito/react-native-tcp-socket)

---

**Enjoy your chess games!**

For questions or issues, please open an issue on GitHub.
