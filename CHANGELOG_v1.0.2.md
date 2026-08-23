# ChessLAN v1.0.2 - Changelog

## Release Date
TBD

## Major Features

### 🆕 Dual Connection Modes
- Added support for **Phone Hotspot mode** alongside WiFi Network mode
- New connection type selector screen on app launch
- Users can now play anywhere without requiring a WiFi router

### 📱 Improved IP Configuration
- **Automatic IP detection** - Host's IPv4 address displayed automatically
- **Simplified IP entry** - Guests only enter IP numbers (e.g., 192.168.1.100)
- No more confusing `ws://` or `:3001` in IP configuration
- **IPv6 filtering** - Only IPv4 addresses shown and accepted
- **Copy buttons** for both Room Code and IP address

### 🎨 Enhanced UI/UX
- New simplified Home screen with username and About only
- Dedicated screens for WiFi and Hotspot modes
- IP configuration via modal instead of Settings screen
- IP status indicators (configured/not configured) on home screens
- Mode-specific banners and instructions
- Removed Settings button (replaced with inline IP configuration)

## New Files

### Screens
- `screens/ConnectionTypeSelect.tsx` - Choose between WiFi or Hotspot mode
- `screens/HomeWiFi.tsx` - WiFi mode multiplayer lobby
- `screens/HomeHotspot.tsx` - Hotspot mode multiplayer lobby

### Components
- `components/IPConfigModal.tsx` - Modal for IP configuration with validation

### Utilities
- `utils/networkUtils.ts` - Network helper functions:
  - `getDeviceIPv4()` - Get device's IPv4 address
  - `validateIPFormat()` - Validate IP format
  - `isIPv6()` - Filter IPv6 addresses
  - `getNetworkType()` - Detect WiFi/cellular/none
  - `getConnectionStatusText()` - Format connection status

## Modified Files

### Core Changes
- `screens/Home.tsx` - Simplified to username setup and About only
- `screens/HostGame.tsx` - Added automatic IP detection and display with copy button
- `config.ts` - Complete rewrite:
  - Separate storage for WiFi and Hotspot IPs
  - Connection mode tracking
  - Simplified IP-only storage (no full URLs)
  - Legacy migration support
- `App.tsx` - Updated navigation with new screens
- `components/ChessLANFooter.tsx` - Added version prop support

### Version Bumps
- `package.json` - Updated to v1.0.2, added `expo-network` dependency
- `app.json` - Updated to v1.0.2
- `README.md` - Updated documentation for v1.0.2 features
- `PROJECT.md` - Updated technical documentation

## Technical Improvements

### Network Detection
- Added expo-network dependency for network state detection
- IPv4 detection filters out IPv6 addresses automatically
- Network connection status display in IP config modal

### Storage Architecture
- **Mode-specific IP storage:**
  - `WIFI_SERVER_IP` for WiFi mode
  - `HOTSPOT_SERVER_IP` for Hotspot mode
  - `CURRENT_CONNECTION_MODE` tracks active mode
- Automatic legacy migration from v1.0.1 format
- Cached IP values for performance

### UI/UX Improvements
- IP validation with real-time feedback
- Pre-filled IP values from last connection
- Success animations on save
- Network status indicators
- Button state management (configured vs not configured)
- Copy functionality for Room Code and IP

## Navigation Flow Changes

### Before (v1.0.1)
```
Home → SelectMode → HostGame → GameRoom
     → JoinGame → GameRoom
```

### After (v1.0.2)
```
Home → ConnectionTypeSelect → HomeWiFi → SelectMode → HostGame → GameRoom
                            → HomeHotspot →         → JoinGame → GameRoom
```

## Breaking Changes
- None - Backward compatible with v1.0.1
- Legacy IP configuration automatically migrated to WiFi mode

## Bug Fixes
- Fixed IPv6 address handling (now properly filtered)
- Improved connection error handling
- Better cleanup on server restart

## Known Issues
- IPv6-only networks not supported (IPv4 required)
- Hotspot IP must still be entered manually (no auto-detection for guest)

## Dependencies Added
- `expo-network: ~8.0.0` - Network state and IP detection

## Migration Notes
- Existing users will see their saved IP migrated to WiFi mode automatically
- No action required from users updating from v1.0.1

## Future Improvements (v1.2+)
- Auto-detection of host IP for guests
- UDP broadcast for host discovery
- Reconnection handling
- Move sound effects and haptic feedback

---

**Full Diff:** [View on GitHub](link-to-diff)
**Download:** [Get v1.0.2](link-to-release)
