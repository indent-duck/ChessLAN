# Server Configuration Guide

## Overview
The app now supports user-configurable WebSocket server URLs, allowing players to connect to different server instances without rebuilding the app.

## Features Implemented

### 1. **Configurable Server URL**
- Server URL is stored in AsyncStorage (persists between app restarts)
- Default fallback: `ws://192.168.8.175:3001`
- Users can update the URL through the Settings modal

### 2. **Settings UI**
- Settings button added to Home screen header (gear icon)
- Modal interface for editing server URL
- Input validation:
  - Must start with `ws://` or `wss://`
  - Cannot be empty
- Shows helpful hints about URL format

### 3. **How It Works**

**For Users:**
1. Open the app
2. Tap the settings icon (⚙️) in the top-right of the Home screen
3. Enter your server's IP address and port (e.g., `ws://192.168.1.100:3001`)
4. Tap "Save"
5. The app will use this URL for all future connections

**For Developers:**
- Server URL is managed in `config.ts`
- Functions: `getServerUrl()` and `setServerUrl(url)`
- Socket connections automatically use the configured URL
- No code changes needed when changing networks

## Files Modified

1. **`config.ts`**
   - Added `getServerUrl()` - async function to retrieve stored URL
   - Added `setServerUrl(url)` - async function to save URL
   - Uses AsyncStorage for persistence

2. **`hooks/useSocket.ts`**
   - Updated `getSocket()` to be async
   - Updated `sendMsg()` to await socket initialization
   - Socket now uses dynamic URL from config

3. **`screens/Home.tsx`**
   - Added settings button in header
   - Added settings modal with URL input
   - Input validation and user feedback
   - Loads saved URL on mount

## Network Requirements

### Development
- Phone and computer must be on the same WiFi network
- Find your computer's local IP: 
  - Windows: `ipconfig` (look for IPv4 Address)
  - Mac/Linux: `ifconfig` or `ip addr`
- Use that IP in the server URL: `ws://YOUR_IP:3001`

### Production
- Deploy the WebSocket server to a cloud provider
- Use a public domain/IP
- Use secure WebSocket (`wss://`) for HTTPS apps
- Update the server URL in app settings

## Running the Server

```bash
cd server
npm install
node index.js
```

Server runs on port 3001 by default.

## Troubleshooting

**Connection fails:**
- Verify server is running (`node server/index.js`)
- Check firewall allows port 3001
- Confirm devices are on same network
- Try pinging the server IP from your phone's network

**"Room not found" error:**
- Server may have restarted (rooms are in-memory)
- Try creating a new room

**Can't connect after bundling:**
- Open app settings and update server URL
- Default URL is for development only
