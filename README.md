# ChessLAN ♟️

A React Native chess app for **true local network multiplayer** - play chess with a friend over WiFi without needing internet or an external server!

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## Features

### 🎮 Gameplay
- ♟️ **Full chess implementation** with legal move validation
- ⏱️ **Multiple time controls:** Rapid (10 min), Blitz (5 min), Bullet (1 min), Custom
- ➕ **Increment support** (e.g., 5+3, 3+2)
- 🔄 **Board flip** - play as White or Black
- 🏆 **Game end conditions:** Checkmate, timeout, resignation, draw

### 🌐 Local Network Multiplayer
- 📱 **2-phone gameplay** - no laptop or cloud server needed
- 🏠 **100% local** - works over WiFi without internet
- 🔒 **Privacy first** - no data leaves your network
- 🚀 **Low latency** - direct device-to-device communication
- 💰 **Free hosting** - no server costs

### 🎨 User Experience
- 🎯 **Clean, modern UI** with smooth animations
- 👤 **Custom usernames** 
- ⚙️ **Easy setup** - just enter host's IP once
- 🔢 **Simple room codes** - 4 characters to join
- ✅ **Real-time sync** - moves appear instantly
- 📊 **Move history** with scrollable list

## How It Works

```
┌─────────────────────┐         ┌─────────────────────┐
│   Host Phone        │         │   Guest Phone       │
│                     │         │                     │
│  TCP Server :3001   │◄───────►│  TCP Client         │
│  Room Code: AB12    │  WiFi   │  Connects to Host IP│
│                     │         │                     │
└─────────────────────┘         └─────────────────────┘
```

1. **Host** opens app and creates a game
2. **Host phone** starts a TCP server on port 3001
3. **Host** shares 4-character room code
4. **Guest** enters host's IP address in settings (one-time setup)
5. **Guest** joins using the room code
6. Both players see each other and play in real-time!

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

See [LOCAL_MULTIPLAYER_GUIDE.md](LOCAL_MULTIPLAYER_GUIDE.md) for detailed setup instructions.

**Quick Start:**
1. Install ChessLAN on 2 phones
2. Connect both to same WiFi
3. Host creates game, gets room code
4. Guest enters host's IP in Settings
5. Guest joins with room code
6. Play chess!

### For Developers

See [PROJECT.md](PROJECT.md) for architecture details.

**Key Files:**
- `hooks/useLocalServer.ts` - Embedded TCP server (host)
- `hooks/useLocalClient.ts` - TCP client (guest)
- `screens/HostGame.tsx` - Host game creation
- `screens/JoinGame.tsx` - Guest game joining
- `screens/GameRoom.tsx` - Chess gameplay

## Testing

See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) for comprehensive testing guide.

```bash
# Development testing (fastest)
npx expo start

# View Android logs
adb logcat *:S ReactNative:V ReactNativeJS:V

# Production testing
eas build --platform android --profile preview
```

## Architecture

### Local Networking
- **Host:** Runs embedded TCP server on port 3001
- **Guest:** Connects as TCP client to host's IP
- **Protocol:** JSON messages over TCP with newline delimiters
- **Messages:** moves, game state, resign, draw offers, etc.

### Message Types
```typescript
// Guest → Host
{ type: "join", code: "AB12", username: "Player" }
{ type: "move", move: { from: "e2", to: "e4", promotion: "q" } }
{ type: "resign" | "draw_offer" | "draw_accept" | "leave" }

// Host → Guest
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
│   ├── HostGame.tsx   # Create & host game
│   ├── JoinGame.tsx   # Join existing game
│   ├── GameRoom.tsx   # Chess gameplay
│   └── ...
├── hooks/             # React hooks
│   ├── useLocalServer.ts   # Host TCP server
│   ├── useLocalClient.ts   # Guest TCP client
│   └── useSocket.ts        # Legacy (dev only)
├── components/        # Reusable components
├── assets/            # Images, SVGs, fonts
├── server/            # Node.js server (dev only)
└── types/             # TypeScript definitions
```

## Roadmap

### v1.1 (Planned)
- [ ] UDP broadcast for auto host discovery
- [ ] Reconnection handling
- [ ] Chess960 variant support
- [ ] Promotion piece selection UI
- [ ] Move sound effects
- [ ] Haptic feedback

### v2.0 (Future)
- [ ] Game history/replays
- [ ] ELO rating system (local)
- [ ] Multiple concurrent games
- [ ] Spectator mode
- [ ] Game analysis

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Known Limitations

- **Manual IP Configuration:** Guest must enter host's IP address
- **Same Network Required:** Both phones must be on same WiFi
- **No Reconnection:** Connection loss ends the game
- **Host Dependency:** If host quits, game ends

These are inherent to the peer-to-peer architecture and prioritize privacy/local play.

## Troubleshooting

### "Failed to connect to host"
- Ensure both phones on same WiFi network
- Verify host's IP address is correct (format: `ws://192.168.x.x:3001`)
- Check firewall not blocking port 3001
- Ensure host has started hosting before guest tries to join

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

Built with React Native and ❤️ for chess enthusiasts who value privacy and local play.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Chess piece SVGs from [chess.com](https://chess.com)
- Chess logic powered by [chess.js](https://github.com/jhlywa/chess.js)
- Networking via [react-native-tcp-socket](https://github.com/Rapsssito/react-native-tcp-socket)

---

**Enjoy your chess games!** ♟️

For questions or issues, please open an issue on GitHub.
