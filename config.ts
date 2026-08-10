import AsyncStorage from "@react-native-async-storage/async-storage";

// Default server URL (fallback)
const DEFAULT_SERVER_URL = "ws://192.168.8.175:3001";
const STORAGE_KEY = "SERVER_URL";

let cachedUrl: string | null = null;

// Get the server URL from AsyncStorage or use default
export async function getServerUrl(): Promise<string> {
  if (cachedUrl) return cachedUrl;
  
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    cachedUrl = stored ?? DEFAULT_SERVER_URL;
    return cachedUrl;
  } catch {
    return DEFAULT_SERVER_URL;
  }
}

// Save a new server URL
export async function setServerUrl(url: string): Promise<void> {
  cachedUrl = url;
  await AsyncStorage.setItem(STORAGE_KEY, url);
}

// For backward compatibility (deprecated, use getServerUrl() instead)
export const SERVER_URL = DEFAULT_SERVER_URL;
