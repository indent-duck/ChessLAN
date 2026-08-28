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
 * Known hotspot subnet prefixes (first three octets) across Android OEMs, iOS, and Linux.
 * Covers Samsung, Xiaomi, OPPO, realme, OnePlus, and many Android 11+ devices.
 */
export const HOTSPOT_SUBNETS = [
  '192.168.42',
  '192.168.43',
  '192.168.44',
  '192.168.45',
  '192.168.137',
  '192.168.150',
  '172.20.10',
  '10.0.0',
  '10.42.0',
];

/**
 * Check if the current IP address looks like a hotspot IP
 * Returns true if IP starts with any known hotspot subnet prefix
 */
export function isLikelyHotspotIP(ip: string | null): boolean {
  if (!ip) return false;
  
  return HOTSPOT_SUBNETS.some((subnet) => ip.startsWith(`${subnet}.`));
}

/**
 * Detect if device is likely acting as a hotspot
 * Returns true if the device IP is in a known hotspot subnet AND is a
 * gateway-style host octet (.1 or .2) OR equals the default gateway IP.
 */
export async function isHotspotActive(): Promise<boolean> {
  try {
    const ip = await getDeviceIPv4();
    console.log('[NetworkUtils] isHotspotActive - detected device IP:', ip);
    
    if (!ip) return false;
    
    // Check if IP matches platform's hotspot gateway pattern
    const defaultHotspotIP = getDefaultHotspotIP();
    console.log('[NetworkUtils] isHotspotActive - default hotspot IP:', defaultHotspotIP);
    
    // Exact match for gateway address
    if (ip === defaultHotspotIP) return true;
    
    // IP must be in a known hotspot subnet first
    if (!isLikelyHotspotIP(ip)) {
      console.log('[NetworkUtils] isHotspotActive - IP not in known hotspot subnet');
      return false;
    }
    
    // Gateway-style host octet (.1 or .2)
    const lastOctet = ip.split('.').pop();
    if (lastOctet === '1' || lastOctet === '2') return true;
    
    return false;
  } catch (error) {
    console.error('[NetworkUtils] Failed to detect hotspot:', error);
    return false;
  }
}

/**
 * Detect if the device is connected to a wireless (WiFi) network
 */
export async function isConnectedToWireless(): Promise<boolean> {
  return (await getNetworkType()) === 'wifi';
}

/**
 * Get a list of candidate host hotspot gateway IPs
 * Used for guest hints / quick-set
 */
export function getGatewayCandidates(): string[] {
  const candidates = new Set<string>([getDefaultHotspotIP()]);
  
  HOTSPOT_SUBNETS.forEach((subnet) => {
    candidates.add(`${subnet}.1`);
    candidates.add(`${subnet}.2`);
  });
  
  return Array.from(candidates);
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
