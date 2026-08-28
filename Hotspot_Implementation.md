# Hotspot Multiplayer — Implementation Plan

## Status
**In review** — revised plan supersedes the earlier draft. Earlier items (below) are already implemented in the working tree; the new work is the **HotspotPrep screen** + removing the Host/Guest role toggle. Subsequently, the maintainer decided to **remove the host-side hotspot check/gating** — the host enters the host room regardless of hotspot state (see §6a).

**IMPORTANT — do NOT auto-commit any changes.** All changes are gated behind explicit review and go-ahead from the maintainer. The plan doc is being updated now; implementation in the project must wait for the go signal.

Owned by: ChessLAN maintainer.

## Context
Hotspot multiplayer is functional end-to-end today:
- Host runs the embedded TCP server on `0.0.0.0:3001` (this already accepts connections over both the WiFi and hotspot interfaces).
- Guest connects to the host's hotspot **gateway IP** (canonical: `192.168.43.1` Android, `172.20.10.1` iOS).
- Mode-specific IP storage already exists in `config.ts` (`WIFI_SERVER_IP` / `HOTSPOT_SERVER_IP` / `CURRENT_CONNECTION_MODE`).

A first pass addressed detection fragility, the server lifecycle race, and stale copy/dead code. The remaining work is a **UX/detection restructure**: remove the manual Host/Guest toggle and add a dedicated **prep/confirmation screen** that validates hotspot setup and gates the user before they reach the host/join/custom screens.

## Goals
1. Remove the manual **Host vs Guest** role toggle from the hotspot lobby so hosting/joining are implicit by button (mirroring WiFi mode): hosting via the mode carousel's "Host … Game" button, joining via "Join with Room Code".
2. Add a new **HotspotPrep** screen between the hotspot lobby and the host/join/custom screens. The **join** path shows status/warnings and **gates** continuing until the guest is connected and a host IP is configured; the **host** path is informational and does not gate (per maintainer decision).
3. Move hotspot IP configuration onto the prep screen.
4. Keep the already-delivered detection, race, copy, and dead-code fixes.

## Non-goals
- No UDP broadcast / auto host discovery (already in the roadmap, separate effort).
- No reconnection handling (separate effort).
- No changes to the TCP wire protocol.

---

## 1. [DONE] Hotspot detection is fragile across Android OEMs

**Root cause**
`isLikelyHotspotIP()` only recognized `192.168.43.*` and `172.20.10.*` (utils/networkUtils.ts). `isHotspotActive()` required the device IP to match the gateway exactly. Samsung / Xiaomi / OPPO / realme / OnePlus and many Android 11+ devices use other subnets, so the ON/OFF banner was frequently wrong (mostly false negatives).

**Implementation (done)**
- Exported constant `HOTSPOT_SUBNETS`:
  ```ts
  ['192.168.42', '192.168.43', '192.168.44', '192.168.45',
   '192.168.137', '192.168.150', '172.20.10', '10.0.0', '10.42.0']
  ```
- `isLikelyHotspotIP(ip)`: returns true if the IP starts with any subnet prefix in `HOTSPOT_SUBNETS`.
- `isHotspotActive()`: returns true if the device IP is in a known hotspot subnet **and** is a gateway-style host octet (`.1` or `.2`) **or** equals `getDefaultHotspotIP()`.
- Added `isConnectedToWireless(): Promise<boolean>` → `getNetworkType() === 'wifi'`.
- Added `getGatewayCandidates(): string[]` → default platform gateway + `.1`/`.2` of known subnets.

**Files**
- `utils/networkUtils.ts`

---

## 2. [DONE] Server restart race can leak a bound port → "App Restart Required"

**Root cause**
`startServer()` scheduled `attemptStartServer()` on a 300ms `setTimeout` (hooks/useLocalServer.ts). Backing out of HostGame inside that window ran `stopServer()`, but the timer still fired and started a server that was never stopped. The next host attempt hit `EADDRINUSE`, exhausted the 5 retries, and showed the "close and reopen the app" dead-end.

**Implementation (done)**
- Added module-level `pendingStartTimer` and `serverPending` flag.
- `startServer()` stores the `setTimeout` id and sets `serverPending = true`.
- `attemptStartServer()` guards on `serverPending` and aborts if false; the EADDRINUSE retry `setTimeout` also checks the flag / clears the timer on stop.
- `stopServer()` and `globalForceCleanup()` clear `pendingStartTimer` and reset `serverPending = false`.
- Rest of cleanup behavior left unchanged.

**Files**
- `hooks/useLocalServer.ts`

---

## 3. [DONE] Hotspot copy fixes

**Implementation (done)**
- `IPConfigReminder` gained a `mode: 'wifi' | 'hotspot'` prop; hotspot+host copy says "Guest must connect to your hotspot network".
- `IPConfigModal` wired up the previously unused `hotspotHintBox` / `quickSetButton` styles; in hotspot mode it shows "Expected hotspot IP: {getDefaultHotspotIP()}" with a one-tap quick-set button.
- Stale copy in `screens/CustomTime.tsx` updated from "Configure server IP in Home → Settings" → "Configure Host IP on the lobby screen".

**Files**
- `components/IPConfigReminder.tsx`
- `components/IPConfigModal.tsx`
- `screens/CustomTime.tsx`
- `screens/HostGame.tsx` (passes `mode` to `IPConfigReminder`)

---

## 4. [DONE] Dead code & docs cleanup

**Implementation (done)**
- Deleted `screens/SelectMode.tsx` (+ its App.tsx import/registration — unreachable; HomeWiFi/HomeHotspot/CustomTime navigate directly to HostGame).
- Deleted `screens/ConnectionTypeSelect.tsx` (not registered in App.tsx).
- Deleted `screens/Home.tsx.backup`.
- Updated `PROJECT.md` navigation flow section.

**Files**
- `App.tsx`
- `screens/SelectMode.tsx` (delete)
- `screens/ConnectionTypeSelect.tsx` (delete)
- `screens/Home.tsx.backup` (delete)
- `PROJECT.md`

---

## 5. [NEW] Remove Host/Guest role toggle from HomeHotspot

**Root cause / rationale**
An earlier draft added a manual Host/Guest segmented control below the "Hotspot Mode" banner so the ON/OFF warning and IP handling could be role-appropriate. The maintainer decided this toggle is undesirable — it should behave like WiFi mode instead, where the **action** (hosting vs joining) determines the role.

**Fix — implicit role by action, mirror HomeWiFi**
- `screens/HomeHotspot.tsx`:
  - Remove `HOTSPOT_ROLE_KEY`, `type Role`, `role` state, `connectedToWireless` state, `setAndPersistRole()`.
  - Remove the `AsyncStorage` role read in the mount `useEffect`.
  - Remove the `roleToggle` segmented-control JSX block below the header banner.
  - Remove role-dependent display logic (host ON/OFF banner, guest connection status, guest quick-set hint, "Enter Host's IP" vs "Configure Host IP" label branch).
  - Remove now-unused styles (`roleToggle`, `roleOption*`, `guestHint*`).
- Routing change: the "Host … Game" button and "Join with Room Code" button now route through the new **HotspotPrep** screen (see §6) instead of directly to HostGame/CustomTime/JoinGame.
- The HotspotIP configuration **moves** to the prep screen (see §6), so strip any IP config/status UI from HomeHotspot's guest section, leaving it a simple lobby with the carousel, host button, and join button.

**Files**
- `screens/HomeHotspot.tsx`

---

## 6. [NEW] HotspotPrep validation screen

New screen registered in `App.tsx` as `HotspotPrep`. It sits between the hotspot lobby and the actual host/join/custom screens and **gates** the user until hotspot setup is verified.

Route params: `{ username, action: 'host' | 'join', mode?, time?, variant?, isCustom? }`

### 6a. Host action (from "Host … Game" button)
- On mount, capture the detected device IP for reference (no verification spinner — nothing blocks the host).
- Show the host's detected device IP and expected default hotspot IP as informational reference.
- Show a reminder to turn the hotspot on so guests can connect once hosting starts.
- **"Host … Game" button is always enabled** for the host — hotspot ON/OFF status is **not** checked and does **not** gate entry into the host room.
  - If `isCustom` → navigate to `CustomTime` (which then flows to HostGame).
  - Else → navigate to `HostGame` with `{ mode, time, username, variant }`.

> **Note (maintainer decision):** Hotspot detection via `isHotspotActive()` was removed from the host path. During development the phone must share the laptop's WiFi to load the dev bundle, so the phone's own IP is the WiFi client IP — not the hotspot gateway. This makes IP-based auto-detection unable to see the hotspot while testing, and a native module (e.g. `@react-native-tethering/hotspot`) is unmaintained (2023, RN 0.71/React 18), has no Expo config plugin, and isn't vetted — high risk on this RN 0.81/React 19/New-Architecture stack. Decision: drop the checker and the blocking; the host proceeds regardless. `isHotspotActive()` is retained in `utils/networkUtils.ts` (still used for the non-blocking informational banner in `HostGame`).

### 6b. Join action (from "Join with Room Code" button)
The guest does **not** have their own hotspot on; they join the host's hotspot, so validate the guest setup instead:
- On mount, detect wireless connectivity via `isConnectedToWireless()`.
- Show status:
  - connected → green "Connected to the host's network ✓"
  - not connected → red warning "Connect to the host's hotspot first".
- **Host IP configuration** (moved here from HomeHotspot):
  - Show configured host IP status if set.
  - If unset, show a quick-set hint (default gateway IP) and a "Configure Host IP" button that opens `IPConfigModal` (hotspot mode, which already has the quick-set).
- **Gated "Continue to Join" button** — enabled **only** when `connectedToWireless === true` **AND** a host IP is configured. → navigate to `JoinGame` with `{ username }`.

### 6c. Shared
- Header with back button, "Hotspot Mode" banner, info/instructions icon.
- Consistent styling with the existing green (`#69923e`) theme.
- Footer.

**Files**
- `screens/HotspotPrep.tsx` (new)
- `App.tsx` (register `HotspotPrep`)
- `screens/CustomTime.tsx` (unchanged — prep routes to it for custom)

---

## Navigation flow (after this work — hotspot mode)
```
Home (username setup)
  ↓
HomeHotspot (carousel + Host/Join buttons, no role toggle)
  ├─ "Host … Game" ──────> HotspotPrep (host)
  │        ├─ standard ──> HostGame ──> GameRoom
  │        └─ custom   ──> CustomTime ──> HostGame ──> GameRoom
  └─ "Join with Room Code" ──> HotspotPrep (join) ──> (verified) ──> JoinGame ──> GameRoom
```
HotspotPrep hosts the hotspot IP configuration. The **join** path gates onward navigation until the guest is connected and a host IP is configured; the **host** path does not gate (always continues to the host room).

---

## Implementation order (for the go-ahead)
1. Create `screens/HotspotPrep.tsx` (host + join actions, gated buttons, IP config via `IPConfigModal`).
2. Strip `screens/HomeHotspot.tsx` down to a lobby (remove role toggle + role logic + IP config UI).
3. Route HomeHotspot host/join buttons through `HotspotPrep`.
4. Register `HotspotPrep` in `App.tsx`.
5. Update `PROJECT.md` navigation flow section.
6. Typecheck (`npx tsc --noEmit`) — only the pre-existing `useLocalServer.ts` `tempServerRef.destroy` type error should remain.

---

## Test plan (2 devices, dev client)
- **Hotspot happy path (host):** HomeHotspot → HotspotPrep shows the host's device IP; host button enabled → HostGame creates room; guest joins; play full move exchange incl. timers + increment.
- **Host not gated:** with the hotspot OFF, HotspotPrep still lets the host proceed into the host room (no hotspot check, no blocking).
- **Custom time + Chess960 over hotspot:** HomeHotspot (Custom) → HotspotPrep → CustomTime → HostGame → GameRoom.
- **Guest gating:** disconnected from the network and/or no host IP set → "Continue to Join" disabled; connect + set host IP → enabled; joins and plays.
- **Guest must never auto-store its own IP:** configured IP stays empty until the host IP is entered on the prep screen.
- **Rapid back-out:** enter HostGame and leave within ~300ms, repeated 3–5× → no "App Restart Required"; next server start binds cleanly.
- **WiFi mode regression:** full WiFi flow still works; no behavior change from the detection/refactor.
