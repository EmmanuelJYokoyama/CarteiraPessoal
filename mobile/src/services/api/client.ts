import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_BASE_URL = 'http://localhost:3000';

const REQUEST_TIMEOUT = 30000;

export const API_BASE_URL = DEFAULT_BASE_URL;

type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
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