import {Platform} from 'react-native';

const DEFAULT_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const API_BASE_URL = DEFAULT_BASE_URL;

type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const message =
      typeof payload.error === 'string' ? payload.error : 'Falha ao processar requisição';
    throw new Error(message);
  }

  return payload as T;
}