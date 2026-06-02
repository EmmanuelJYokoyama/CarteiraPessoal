import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCachedResponse,
  setCachedResponse,
  addPendingRequest,
  getPendingRequests,
  removePendingRequest,
} from '@services/cache';
import {isNetworkOnline} from '@services/connectivity';
import {logSyncEvent} from '@services/telemetry/firebaseTelemetry';

const DEFAULT_BASE_URL = 'https://carteirapessoal.onrender.com';

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
];

type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  cacheTTL?: number;
  skipCache?: boolean;
  skipQueue?: boolean;
  responseType?: 'json' | 'blob' | 'text';
};

// Old implementation - to be replaced
// [REMOVED OLD IMPLEMENTATION]

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
      void logSyncEvent('sync_pending_requests', 'success', {
        method: request.method,
        path: request.path,
      });
      success++;
      console.log(`[Sync] ✅ ${request.method} ${request.path}`);
    } catch (error) {
      failed++;
      void logSyncEvent('sync_pending_requests', 'failure', {
        method: request.method,
        path: request.path,
        error_message: error instanceof Error ? error.message.slice(0, 80) : 'unknown',
      });
      console.error(`[Sync] ❌ ${request.method} ${request.path}:`, error);
    }
  }

  console.log(`[Sync] Done: ${success} ok, ${failed} fail`);
  return {success, failed};
}

// Helper methods
async function apiRequestMain<T>(
  path: string,
  options: RequestOptions
): Promise<T> {
  return makeRequest<T>(path, options);
}

export const apiRequest = Object.assign(apiRequestMain, {
  get: <T,>(path: string, options?: Partial<RequestOptions>) =>
    makeRequest<T>(path, {...(options || {}), method: 'GET'} as RequestOptions),
  post: <T,>(path: string, body?: unknown, options?: Partial<RequestOptions>) =>
    makeRequest<T>(path, {...(options || {}), method: 'POST', body, ...options} as RequestOptions),
  put: <T,>(path: string, body?: unknown, options?: Partial<RequestOptions>) =>
    makeRequest<T>(path, {...(options || {}), method: 'PUT', body} as RequestOptions),
  patch: <T,>(path: string, body?: unknown, options?: Partial<RequestOptions>) =>
    makeRequest<T>(path, {...(options || {}), method: 'PATCH', body} as RequestOptions),
  delete: <T,>(path: string, options?: Partial<RequestOptions>) =>
    makeRequest<T>(path, {...(options || {}), method: 'DELETE'} as RequestOptions),
});

async function makeRequest<T>(
  path: string,
  options: Partial<RequestOptions>
): Promise<T> {
  const fullOptions: RequestOptions = {
    method: (options.method || 'GET') as RequestOptions['method'],
    ...options,
  };

  const isOnline = isNetworkOnline();
  const cacheKey = `${fullOptions.method}:${path}`;

  if (fullOptions.method === 'GET' && !fullOptions.skipCache) {
    const cached = await getCachedResponse<T>(cacheKey);
    if (cached) {
      console.log(`[API] Cache hit: ${path}`);
      return cached;
    }
  }

  // Check if we're offline and should queue the request
  if (!isOnline && !PUBLIC_ENDPOINTS.includes(path) && !fullOptions.skipQueue) {
    console.log(`[API] Offline, queueing: ${fullOptions.method} ${path}`);
    await addPendingRequest({
      method: fullOptions.method,
      path,
      body: fullOptions.body,
    });
    throw new Error('Offline - request queued');
  }

  try {
    // Ensure path begins with '/'
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${API_BASE_URL}${normalizedPath}`;
    const token = await AsyncStorage.getItem('@access_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token && !PUBLIC_ENDPOINTS.includes(path)) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        method: fullOptions.method,
        headers,
        body:
          fullOptions.body && fullOptions.method !== 'GET'
            ? JSON.stringify(fullOptions.body)
            : undefined,
        signal: controller.signal,
      });

      if (response.status === 401 && token) {
        try {
          const refreshToken = await AsyncStorage.getItem('@refresh_token');
          if (refreshToken) {
            const refreshResponse = await fetch(
              `${API_BASE_URL}/auth/refresh`,
              {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({refreshToken}),
                signal: controller.signal,
              }
            );

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              await AsyncStorage.setItem(
                '@access_token',
                refreshData.accessToken
              );

              headers['Authorization'] = `Bearer ${refreshData.accessToken}`;

              const retryResponse = await fetch(url, {
                method: fullOptions.method,
                headers,
                body:
                  fullOptions.body && fullOptions.method !== 'GET'
                    ? JSON.stringify(fullOptions.body)
                    : undefined,
                signal: controller.signal,
              });

              if (!retryResponse.ok) {
                throw new Error(
                  `Error ${retryResponse.status}: ${retryResponse.statusText}`
                );
              }

              const data = await retryResponse.json();

              if (
                fullOptions.method === 'GET' ||
                fullOptions.cacheTTL
              ) {
                await setCachedResponse(
                  cacheKey,
                  data,
                  fullOptions.cacheTTL
                );
              }

              return data as T;
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

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        const message = errorData.error || `Error ${response.status}`;
        throw new Error(message);
      }

      let data: any;
      const type = fullOptions.responseType || 'json';

      switch (type) {
        case 'blob':
          data = await response.blob();
          break;
        case 'text':
          data = await response.text();
          break;
        default:
          data = await response.json();
          break;
      }

      if (
        fullOptions.method === 'GET' ||
        fullOptions.cacheTTL
      ) {
        await setCachedResponse(cacheKey, data, fullOptions.cacheTTL);
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