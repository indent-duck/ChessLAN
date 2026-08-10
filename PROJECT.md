# Chess Dwight — Project Context

## What it is
A React Native (Expo ~54) mobile chess app for peer-to-peer multiplayer between two players on the same local network / via room codes.

## Tech Stack
- React Native 0.81.5 / Expo ~54
- TypeScript
- React Navigation (native stack)
- react-native-svg + react-native-svg-transformer (SVG pieces and icons)
- Fonts: GoogleSansFlex (400, 500, 700), ArchivoBlack
- `server/` folder exists but is empty — backend not started yet

## Navigation Flow
```
Home → CustomTime → SelectMode → HostGame → GameRoom
                               → JoinGame
```
- Home: username input (editable inline), horizontal scrollable card carousel to pick game mode
- CustomTime: pick minutes (1–30) + increment (0–30s), navigates to SelectMode with custom time string
- SelectMode: choose Host Game or Join Game for the selected mode/time
- HostGame: pick color (white/black), swap sides toggle, then Start Game → GameRoom
- JoinGame: enter 6-character room code to join (UI only, no real networking yet)
- GameRoom: renders the chess board with SVG pieces, per-player timers (static, not counting yet), board flip support

## Screen-by-screen notes

### Home (`screens/Home.tsx`)
- Username stored in local state, editable with inline TextInput + check/edit icon
- Game modes: Rapid (10 min), Blitz (5 min), Bullet (1 min), Custom
- FlatList carousel with snap, scale + opacity spring animations on active card
- Dot indicators below carousel

### SelectMode (`screens/SelectMode.tsx`)
- Receives `mode`, `time`, `username` as route params
- Two buttons: Host Game → HostGame, Join Game → JoinGame
- Slide-up + fade-in panel animation on mount, reverse on back

### HostGame (`screens/HostGame.tsx`)
- Receives `mode`, `time`, `username`
- `flipped` state toggles which color the host plays
- Start Game navigates to GameRoom with `{ mode, time, username, flipped }`

### JoinGame (`screens/JoinGame.tsx`)
- Receives `mode`, `time`
- 6-char uppercase room code input
- Join button disabled until 6 chars entered
- Currently just `console.log("join", code)` — no real networking

### CustomTime (`screens/CustomTime.tsx`)
- Chip selectors for minutes [1,2,3,5,10,15,20,30] and increment [0,1,2,3,5,10,15,30]
- Formats time as `"X min"` or `"X+Y"` (with increment)
- Navigates to SelectMode (skips HostGame/JoinGame choice)

### GameRoom (`screens/GameRoom.tsx`)
- Receives `mode`, `time`, `username`, `flipped`
- `chess.js` `Chess` instance in a ref is the source of truth for board state
- `board` state is derived from `chess.board()` after each move
- `selected` state holds the currently tapped square, `legalSquares` holds valid destinations
- Tapping own piece selects it and shows legal move dots; tapping a legal square executes the move
- Captures shown with a ring overlay, legal moves shown with a dot overlay
- Selected square highlighted in yellow (`#f6f669`)
- Increment support: adds seconds to the moving player's clock after each move
- `turn` driven by `chess.turn()` after each move
- Per-player countdown timers tick every second via `setInterval`, keyed on `turn` and `gameOver`
- Increment applied to the moving player's clock after each move
- Timeout, checkmate, and draw detected and shown in a game-over modal
- Board flip fully supported via `rowColToSquare` / `squareToRowCol` helpers
- Promotion auto-promotes to queen

### GameCard (`components/GameCard.tsx`)
- Card in the Home carousel
- "Play Now" → navigates to CustomTime (if Custom) or SelectMode

## What's NOT done yet
- Actual multiplayer networking (room code system, server, WebSockets)

## Design language
- Background: `#f5f5f0` (off-white) for pre-game screens, `#333638` (dark) for GameRoom
- Primary green: `#1e6b40`
- Light square: `#f0d9b5`, dark square: `#b58863` (classic chess.com palette)
- Rounded panels slide up from bottom with spring animation on most screens
- Font: GoogleSansFlex throughout
