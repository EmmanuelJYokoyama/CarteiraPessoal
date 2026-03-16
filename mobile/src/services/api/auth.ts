import {apiRequest} from './client';

export type LoginPayload = {
  email:    string;
  password: string;
};

export type LoginResponse = {
  accessToken:  string;
  refreshToken: string;
};

export type RegisterPayload = {
  name:     string;
  email:    string;
  password: string;
};

export type RegisterResponse = {
  userId:  string;
  confirmToken: string;
};

export async function login(payload: LoginPayload) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export async function register(payload: RegisterPayload) {
  return apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export async function confirmEmail(token: string) {
  return apiRequest<void>(`/auth/confirm/${token}`, {
    method: 'GET',
  });
}