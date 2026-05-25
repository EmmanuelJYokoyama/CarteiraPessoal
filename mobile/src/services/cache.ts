import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearPendingRequestsTable,
  deletePendingRequest,
  insertPendingRequest,
  listPendingRequests,
  parseOfflineRequestBody,
} from './offlineDatabase';

const CACHE_PREFIX = '@cache:';
const PENDING_REQUESTS_KEY = '@pending_requests';
const PENDING_REQUESTS_MIGRATED_KEY = '@pending_requests_migrated';

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

export async function invalidateCache(endpoint: string): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter(k => 
      k.startsWith(CACHE_PREFIX) && k.includes(endpoint)
    );
    await Promise.all(keysToRemove.map(k => AsyncStorage.removeItem(k)));
    console.log(`[Cache] Invalidated cache for ${endpoint}`);
  } catch (error) {
    console.error('[Cache] Error invalidating cache:', error);
  }
}

export interface PendingRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  timestamp: number;
}

async function migratePendingRequestsIfNeeded(): Promise<void> {
  const alreadyMigrated = await AsyncStorage.getItem(PENDING_REQUESTS_MIGRATED_KEY);

  if (alreadyMigrated === 'true') {
    return;
  }

  const rawPending = await AsyncStorage.getItem(PENDING_REQUESTS_KEY);

  if (rawPending) {
    try {
      const pending = JSON.parse(rawPending) as PendingRequest[];

      for (const request of pending) {
        await insertPendingRequest({
          id: request.id,
          method: request.method,
          path: request.path,
          body: request.body,
          timestamp: request.timestamp,
        });
      }

      await AsyncStorage.removeItem(PENDING_REQUESTS_KEY);
    } catch (error) {
      console.error('[Cache] Error migrating pending requests:', error);
    }
  }

  await AsyncStorage.setItem(PENDING_REQUESTS_MIGRATED_KEY, 'true');
}

export async function addPendingRequest(request: Omit<PendingRequest, 'id' | 'timestamp'>): Promise<string> {
  try {
    const id = `${Date.now()}-${Math.random()}`;
    const newRequest: PendingRequest = {
      ...request,
      id,
      timestamp: Date.now(),
    };

    await migratePendingRequestsIfNeeded();
    await insertPendingRequest(newRequest);
    console.log('[Cache] Added pending request:', id);

    return id;
  } catch (error) {
    console.error('[Cache] Error adding pending request:', error);
    throw error;
  }
}

export async function getPendingRequests(): Promise<PendingRequest[]> {
  try {
    await migratePendingRequestsIfNeeded();

    const rows = await listPendingRequests();

    return rows.map(row => ({
      id: row.id,
      method: row.method,
      path: row.path,
      body: parseOfflineRequestBody(row.body),
      timestamp: row.timestamp,
    }));
  } catch (error) {
    console.error('[Cache] Error getting pending requests:', error);
    return [];
  }
}

export async function removePendingRequest(id: string): Promise<void> {
  try {
    await migratePendingRequestsIfNeeded();
    await deletePendingRequest(id);
  } catch (error) {
    console.error('[Cache] Error removing pending request:', error);
  }
}

export async function clearPendingRequests(): Promise<void> {
  try {
    await clearPendingRequestsTable();
    await AsyncStorage.removeItem(PENDING_REQUESTS_KEY);
  } catch (error) {
    console.error('[Cache] Error clearing pending requests:', error);
  }
}

/**
 * Limpa TODOS os dados do app (cache e pending requests)
 * Use esta função ao fazer logout
 */
export async function clearAllAppData(): Promise<void> {
  try {
    console.log('[Cache] Clearing all app data...');
    await Promise.all([
      clearCache(), // Limpa todos os caches
      clearPendingRequests(), // Limpa requisições pendentes
    ]);
    await AsyncStorage.removeItem(PENDING_REQUESTS_MIGRATED_KEY);
    console.log('[Cache] ✅ All app data cleared');
  } catch (error) {
    console.error('[Cache] Error clearing all app data:', error);
  }
}
