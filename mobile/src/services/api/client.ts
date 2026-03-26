import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_BASE_URL =
  Platform.OS === 'android' ? 'http://localhost:3000' : 'http://localhost:3000';

export const API_BASE_URL = DEFAULT_BASE_URL;

type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  try {
    console.log(`📡 [${options.method}] ${API_BASE_URL}${path}`);
    
    // Get token from AsyncStorage
    const token = await AsyncStorage.getItem('@access_token');
    
    // Cria um timeout de 30 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const payload = (await response.json()) as Record<string, unknown>;
    
    console.log(`✅ Response status: ${response.status}`, payload);

    if (!response.ok) {
      const message =
        typeof payload.error === 'string' ? payload.error : `Erro ${response.status}`;
      console.error(`❌ API Error:`, message);
      throw new Error(message);
    }

    return payload as T;
  } catch (error) {
    console.error(`❌ Request failed:`, error);
    if (error instanceof TypeError) {
      throw new Error('Erro de conexão. Verifique se o servidor está rodando.');
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout na requisição. Servidor não responde.');
    }
    throw error;
  }
}