import { Platform } from 'react-native';
import * as Network from 'expo-network';

/**
 * Get device's IPv4 address (filter out IPv6)
 */
export async function getDeviceIPv4(): Promise<string | null> {
  try {
    const ipAddress = await Network.getIpAddressAsync();
    
    // Filter out IPv6 addresses
    if (isIPv6(ipAddress)) {
      console.log('[NetworkUtils] IPv6 detected, filtering out:', ipAddress);
      return null;
    }
    
    return ipAddress;
  } catch (error) {
    console.error('[NetworkUtils] Failed to get IP address:', error);
    return null;
  }
}

/**
 * Validate IP format: xxx.xxx.xxx.xxx (0-255)
 */
export function validateIPFormat(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  
  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipRegex);
  
  if (!match) return false;
  
  // Check each octet is between 0-255
  for (let i = 1; i <= 4; i++) {
    const octet = parseInt(match[i], 10);
    if (octet < 0 || octet > 255) return false;
  }
  
  return true;
}

/**
 * Filter IPv6 addresses (starts with 2001:, fe80:, etc.)
 */
export function isIPv6(address: string): boolean {
  if (!address) return false;
  
  // IPv6 addresses contain colons
  return address.includes(':');
}

/**
 * Detect current network connection type
 */
export async function getNetworkType(): Promise<'wifi' | 'cellular' | 'none'> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    
    if (!networkState.isConnected) {
      return 'none';
    }
    
    if (networkState.type === Network.NetworkStateType.WIFI) {
      return 'wifi';
    }
    
    if (networkState.type === Network.NetworkStateType.CELLULAR) {
      return 'cellular';
    }
    
    return 'none';
  } catch (error) {
    console.error('[NetworkUtils] Failed to get network type:', error);
    return 'none';
  }
}

/**
 * Get WiFi SSID (network name) if connected
 * Note: May return null on some devices due to permissions
 */
export async function getWiFiSSID(): Promise<string | null> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    
    if (networkState.type === Network.NetworkStateType.WIFI) {
      // Try to get SSID if available (may require permissions on some platforms)
      // This is a placeholder - actual implementation depends on available APIs
      return 'WiFi Network'; // Generic fallback
    }
    
    return null;
  } catch (error) {
    console.error('[NetworkUtils] Failed to get WiFi SSID:', error);
    return null;
  }
}

/**
 * Get default hotspot IP based on platform
 */
export function getDefaultHotspotIP(): string {
  // Android typically uses 192.168.43.1
  // iOS typically uses 172.20.10.1
  return Platform.OS === 'ios' ? '172.20.10.1' : '192.168.43.1';
}

/**
 * Check if the current IP address looks like a hotspot IP
 * Returns true if IP matches common hotspot patterns
 */
export function isLikelyHotspotIP(ip: string | null): boolean {
  if (!ip) return false;
  
  // Android hotspot: 192.168.43.x
  if (ip.startsWith('192.168.43.')) return true;
  
  // iOS hotspot: 172.20.10.x
  if (ip.startsWith('172.20.10.')) return true;
  
  return false;
}

/**
 * Detect if device is likely acting as a hotspot
 * This checks if the device IP matches common hotspot gateway addresses
 */
export async function isHotspotActive(): Promise<boolean> {
  try {
    const ip = await getDeviceIPv4();
    
    if (!ip) return false;
    
    // Check if IP matches platform's hotspot gateway pattern
    const defaultHotspotIP = getDefaultHotspotIP();
    
    // Exact match for gateway address
    if (ip === defaultHotspotIP) return true;
    
    // Also check for common hotspot subnet patterns
    return isLikelyHotspotIP(ip);
  } catch (error) {
    console.error('[NetworkUtils] Failed to detect hotspot:', error);
    return false;
  }
}

/**
 * Format network connection status for display
 */
export async function getConnectionStatusText(): Promise<string> {
  const networkType = await getNetworkType();
  
  switch (networkType) {
    case 'wifi':
      const ssid = await getWiFiSSID();
      return ssid ? `WiFi: "${ssid}" ✓` : 'WiFi: Connected ✓';
    case 'cellular':
      return 'Mobile Data ✓';
    case 'none':
      return '⚠️ No connection detected';
    default:
      return 'Unknown connection';
  }
}
