import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys for different modes
const WIFI_IP_KEY = "WIFI_SERVER_IP";
const HOTSPOT_IP_KEY = "HOTSPOT_SERVER_IP";
const CURRENT_MODE_KEY = "CURRENT_CONNECTION_MODE"; // Track which mode is active
const LEGACY_SERVER_URL_KEY = "SERVER_URL"; // For backward compatibility

// Default server port
const SERVER_PORT = 3001;

let cachedWiFiIP: string | null = null;
let cachedHotspotIP: string | null = null;
let cachedMode: 'wifi' | 'hotspot' | null = null;

/**
 * Set the current connection mode
 */
export async function setConnectionMode(mode: 'wifi' | 'hotspot'): Promise<void> {
  cachedMode = mode;
  try {
    await AsyncStorage.setItem(CURRENT_MODE_KEY, mode);
  } catch (error) {
    console.error('[Config] Failed to set connection mode:', error);
  }
}

/**
 * Get the current connection mode
 */
export async function getConnectionMode(): Promise<'wifi' | 'hotspot'> {
  if (cachedMode) return cachedMode;
  
  try {
    const stored = await AsyncStorage.getItem(CURRENT_MODE_KEY);
    cachedMode = (stored as 'wifi' | 'hotspot') || 'wifi';
    return cachedMode;
  } catch (error) {
    console.error('[Config] Failed to get connection mode:', error);
    return 'wifi';
  }
}

/**
 * Get the server IP for the specified mode
 */
export async function getServerIP(mode: 'wifi' | 'hotspot'): Promise<string | null> {
  const storageKey = mode === 'wifi' ? WIFI_IP_KEY : HOTSPOT_IP_KEY;
  const cached = mode === 'wifi' ? cachedWiFiIP : cachedHotspotIP;
  
  if (cached) return cached;
  
  try {
    const stored = await AsyncStorage.getItem(storageKey);
    
    // If no stored IP, try to migrate from legacy format
    if (!stored) {
      const legacyUrl = await AsyncStorage.getItem(LEGACY_SERVER_URL_KEY);
      if (legacyUrl) {
        const migratedIP = extractIPFromURL(legacyUrl);
        if (migratedIP) {
          // Migrate to WiFi mode by default
          await setServerIP(migratedIP, 'wifi');
          if (mode === 'wifi') {
            return migratedIP;
          }
        }
      }
      return null;
    }
    
    if (mode === 'wifi') {
      cachedWiFiIP = stored;
    } else {
      cachedHotspotIP = stored;
    }
    
    return stored;
  } catch (error) {
    console.error('[Config] Failed to get server IP:', error);
    return null;
  }
}

/**
 * Save the server IP for the specified mode
 */
export async function setServerIP(ip: string, mode: 'wifi' | 'hotspot'): Promise<void> {
  const storageKey = mode === 'wifi' ? WIFI_IP_KEY : HOTSPOT_IP_KEY;
  
  if (mode === 'wifi') {
    cachedWiFiIP = ip;
  } else {
    cachedHotspotIP = ip;
  }
  
  // Also set this as the current mode
  await setConnectionMode(mode);
  
  try {
    await AsyncStorage.setItem(storageKey, ip);
  } catch (error) {
    console.error('[Config] Failed to set server IP:', error);
  }
}

/**
 * Build the full WebSocket URL from IP and port
 * If mode is not specified, uses the last active mode
 */
export async function getServerUrl(mode?: 'wifi' | 'hotspot'): Promise<string> {
  const activeMode = mode || await getConnectionMode();
  const ip = await getServerIP(activeMode);
  
  if (!ip) {
    // Return a placeholder - connection will fail but won't crash
    return `ws://192.168.1.100:${SERVER_PORT}`;
  }
  
  return `ws://${ip}:${SERVER_PORT}`;
}

/**
 * Save server URL (legacy support - extracts IP and saves)
 * @deprecated Use setServerIP instead
 */
export async function setServerUrl(url: string): Promise<void> {
  const ip = extractIPFromURL(url);
  if (ip) {
    await setServerIP(ip, 'wifi');
  }
}

/**
 * Extract IP address from WebSocket URL
 */
function extractIPFromURL(url: string): string | null {
  try {
    // Handle formats like:
    // ws://192.168.1.100:3001
    // wss://192.168.1.100:3001
    // 192.168.1.100
    
    // Remove protocol if present
    let cleanUrl = url.replace(/^wss?:\/\//, '');
    
    // Remove port if present
    const ipWithoutPort = cleanUrl.split(':')[0];
    
    // Validate it looks like an IP address
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (ipRegex.test(ipWithoutPort)) {
      return ipWithoutPort;
    }
    
    return null;
  } catch (error) {
    console.error('[Config] Failed to extract IP from URL:', error);
    return null;
  }
}

// For backward compatibility - deprecated
export const SERVER_URL = `ws://192.168.1.100:${SERVER_PORT}`;
