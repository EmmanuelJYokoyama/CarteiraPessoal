import {apiRequest} from './client';

export type LoginPayload = {
  email:    string;
  password: string;
};

export type LoginResponse = {
  accessToken:  string;
  refreshToken: string;
  name: string;
  email: string;
};

export type RegisterPayload = {
  name:        string;
  email:       string;
  password:    string;
  phoneNumber: string;
};

export type RegisterResponse = {
  userId:  string;
  email:   string;
  message: string;
};

export type ConfirmSmsPayload = {
  email: string;
  code:  string;
};

export type ConfirmSmsResponse = {
  message:     string;
  accessToken: string;
  refreshToken: string;
  name: string;
  email: string;
};

export type ResendSmsPayload = {
  email: string;
};

export type ResendSmsResponse = {
  message: string;
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

export async function confirmSms(payload: ConfirmSmsPayload) {
  return apiRequest<ConfirmSmsResponse>('/sms/confirm', {
    method: 'POST',
    body: payload,
  });
}

export async function resendSms(payload: ResendSmsPayload) {
  return apiRequest<ResendSmsResponse>('/sms/resend', {
    method: 'POST',
    body: payload,
  });
}

export async function confirmEmail(token: string) {
  return apiRequest<void>(`/auth/confirm/${token}`, {
    method: 'GET',
  });
}