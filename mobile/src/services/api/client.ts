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
  Platform.OS === 'android' ? 'http://localhost:3000' : 'http://localhost:3000';

const REQUEST_TIMEOUT = 30000;

export const API_BASE_URL = DEFAULT_BASE_URL;

let onTokenExpired: (() => void) | null = null;

export function setTokenExpiredCallback(callback: () => void) {
  onTokenExpired = callback;
}

const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/confirm-sms',
  '/pin/login',
  '/pin/set',
  '/pin/validate',
];

type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  cacheTTL?: number;
  skipCache?: boolean;
  skipQueue?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const isOnline = isNetworkOnline();
  const cacheKey = `${options.method}:${path}`;

  if (options.method === 'GET' && !options.skipCache) {
    const cached = await getCachedResponse<T>(cacheKey);
    if (cached) {
      console.log(`[API] Cache hit: ${path}`);
      return cached;
    }
  }

  if (!isOnline && options.method !== 'GET' && !options.skipQueue) {
    console.log(`[API] Offline - queuing: ${options.method} ${path}`);
    await addPendingRequest({
      method: options.method,
      path,
      body: options.body,
    });
    throw new Error('OFFLINE_REQUEST_QUEUED');
  }

  if (!isOnline && options.skipQueue) {
    throw new Error('OFFLINE');
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(ep => path.includes(ep));

    if (!isPublicEndpoint) {
      const token = await AsyncStorage.getItem('@access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const url = `${API_BASE_URL}${path}`;
      console.log(`[API] ${options.method} ${url}`);

      let response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      // If token expired, try to refresh
      if (response.status === 401 && !isPublicEndpoint) {
        console.log('[API] Token expired, attempting refresh');
        try {
          const refreshToken = await AsyncStorage.getItem('@refresh_token');
          if (refreshToken) {
            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshToken}`,
              },
            });

            if (refreshResponse.ok) {
              const refreshData = (await refreshResponse.json()) as any;
              const newToken = refreshData.accessToken;
              
              await AsyncStorage.setItem('@access_token', newToken);
              console.log('[API] Token refreshed');

              headers['Authorization'] = `Bearer ${newToken}`;
              response = await fetch(url, {
                method: options.method,
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: controller.signal,
              });
            } else {
              console.log('[API] Refresh failed');
              await AsyncStorage.removeItem('@access_token');
              await AsyncStorage.removeItem('@refresh_token');
              await AsyncStorage.removeItem('@user_data');
              if (onTokenExpired) {
                onTokenExpired();
              }
              throw new Error('Session expired');
            }
          } else {
            await AsyncStorage.removeItem('@access_token');
            await AsyncStorage.removeItem('@user_data');
            if (onTokenExpired) {
              onTokenExpired();
            }
            throw new Error('Session expired');
          }
        } catch (refreshError) {
          console.error('[API] Refresh error:', refreshError);
          await AsyncStorage.removeItem('@access_token');
          await AsyncStorage.removeItem('@refresh_token');
          await AsyncStorage.removeItem('@user_data');
          if (onTokenExpired) {
            onTokenExpired();
          }
          throw refreshError;
        }
      }

      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        const message =
          typeof data.error === 'string' ? data.error : `Error ${response.status}`;
        throw new Error(message);
      }

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

export async function syncPendingRequests(): Promise<{
  success: number;
  failed: number;
}> {
  const isOnline = isNetworkOnline();
  if (!isOnline) {
    console.log('[Sync] Offline, skipping');
    return {success: 0, failed: 0};
  }

  const pending = await getPendingRequests();
  let success = 0;
  let failed = 0;

  console.log(`[Sync] Syncing ${pending.length} requests`);

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

  console.log(`[Sync] Done: ${success} ok, ${failed} fail`);
  return {success, failed};
}