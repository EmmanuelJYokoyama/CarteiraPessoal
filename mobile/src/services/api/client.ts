import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCachedResponse,
  setCachedResponse,
  addPendingRequest,
  getPendingRequests,
  removePendingRequest,
} from '@services/cache';
import {isNetworkOnline} from '@services/connectivity';

const DEFAULT_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const REQUEST_TIMEOUT = 30000;

export const API_BASE_URL = DEFAULT_BASE_URL;

type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  cacheTTL?: number; // milliseconds
  skipCache?: boolean; // force fetch regardless of cache
  skipQueue?: boolean; // skip queueing if offline (throw error instead)
};

export async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const isOnline = isNetworkOnline();
  const cacheKey = `${options.method}:${path}`;

  // For GET requests, try cache first if offline or not skipping cache
  if (options.method === 'GET' && !options.skipCache) {
    const cached = await getCachedResponse<T>(cacheKey);
    if (cached) {
      console.log(`[API] Using cached response for ${path}`);
      return cached;
    }
  }

  // If offline and not a GET, queue the request
  if (!isOnline && options.method !== 'GET' && !options.skipQueue) {
    console.log(`[API] Offline - queueing request: ${options.method} ${path}`);
    await addPendingRequest({
      method: options.method,
      path,
      body: options.body,
    });
    throw new Error('OFFLINE_REQUEST_QUEUED');
  }

  // If offline with skipQueue, throw error
  if (!isOnline && options.skipQueue) {
    throw new Error('OFFLINE');
  }

  // Make actual request
  try {
    let token: string | null = null;
    try {
      token = await AsyncStorage.getItem('@access_token');
    } catch (e) {
      console.warn('[API] Failed to get token:', e);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const url = `${API_BASE_URL}${path}`;
      console.log(`[API] ${options.method} ${url}`);

      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        const message =
          typeof data.error === 'string' ? data.error : `Error ${response.status}`;
        throw new Error(message);
      }

      // Cache successful responses (especially GET)
      if (options.method === 'GET' || options.cacheTTL) {
        await setCachedResponse(cacheKey, data, options.cacheTTL);
      }

      return data as T;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('[API] Error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Timeout ${REQUEST_TIMEOUT / 1000}s`);
      }
      throw error;
    }
    throw new Error('Network request failed');
  }
}

// Retry all pending requests
export async function syncPendingRequests(): Promise<{
  success: number;
  failed: number;
}> {
  const isOnline = isNetworkOnline();
  if (!isOnline) {
    console.log('[Sync] Still offline, skipping sync');
    return {success: 0, failed: 0};
  }

  const pending = await getPendingRequests();
  let success = 0;
  let failed = 0;

  console.log(`[Sync] Syncing ${pending.length} pending requests...`);

  for (const request of pending) {
    try {
      await apiRequest(request.path, {
        method: request.method,
        body: request.body,
        skipQueue: true,
      });

      await removePendingRequest(request.id);
      success++;
      console.log(`[Sync] ✅ ${request.method} ${request.path}`);
    } catch (error) {
      failed++;
      console.error(`[Sync] ❌ ${request.method} ${request.path}:`, error);
    }
  }

  console.log(`[Sync] Complete: ${success} success, ${failed} failed`);
  return {success, failed};
}