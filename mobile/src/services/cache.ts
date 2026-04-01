import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@cache:';
const CACHE_TTL_PREFIX = '@cache_ttl:';
const PENDING_REQUESTS_KEY = '@pending_requests';

export interface CachedResponse<T> {
  data: T;
  timestamp: number;
  ttl?: number; 
}

export async function getCachedResponse<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const parsed: CachedResponse<T> = JSON.parse(cached);
    if (parsed.ttl) {
      const expiresAt = parsed.timestamp + parsed.ttl;
      if (Date.now() > expiresAt) {
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }
    }

    return parsed.data;
  } catch (error) {
    console.error('[Cache] Error getting cached response:', error);
    return null;
  }
}

export async function setCachedResponse<T>(
  key: string,
  data: T,
  ttl?: number 
): Promise<void> {
  try {
    const cached: CachedResponse<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cached));
  } catch (error) {
    console.error('[Cache] Error setting cache:', error);
  }
}

export async function clearCache(key?: string): Promise<void> {
  try {
    if (key) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } else {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(k => k.startsWith(CACHE_PREFIX));
      await Promise.all(cacheKeys.map(k => AsyncStorage.removeItem(k)));
    }
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
}

export interface PendingRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  timestamp: number;
}

export async function addPendingRequest(request: Omit<PendingRequest, 'id' | 'timestamp'>): Promise<string> {
  try {
    const pending = await getPendingRequests();
    const id = `${Date.now()}-${Math.random()}`;
    const newRequest: PendingRequest = {
      ...request,
      id,
      timestamp: Date.now(),
    };

    pending.push(newRequest);
    await AsyncStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(pending));
    console.log('[Cache] Added pending request:', id);

    return id;
  } catch (error) {
    console.error('[Cache] Error adding pending request:', error);
    throw error;
  }
}

export async function getPendingRequests(): Promise<PendingRequest[]> {
  try {
    const data = await AsyncStorage.getItem(PENDING_REQUESTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[Cache] Error getting pending requests:', error);
    return [];
  }
}

export async function removePendingRequest(id: string): Promise<void> {
  try {
    const pending = await getPendingRequests();
    const filtered = pending.filter(r => r.id !== id);
    await AsyncStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[Cache] Error removing pending request:', error);
  }
}

export async function clearPendingRequests(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_REQUESTS_KEY);
  } catch (error) {
    console.error('[Cache] Error clearing pending requests:', error);
  }
}
