import {apiRequest} from './client';

export type SetPinPayload = {
  pin: string;
};

export type SetPinResponse = {
  message: string;
};

export type ValidatePinPayload = {
  pin: string;
};

export type ValidatePinResponse = {
  success: boolean;
  message: string;
};

export type LoginWithPinPayload = {
  email: string;
  pin: string;
};

export type LoginWithPinResponse = {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export async function setPin(payload: SetPinPayload) {
  return apiRequest<SetPinResponse>('/pin/set', {
    method: 'POST',
    body: payload,
  });
}

export async function validatePin(payload: ValidatePinPayload) {
  return apiRequest<ValidatePinResponse>('/pin/validate', {
    method: 'POST',
    body: payload,
  });
}

export async function loginWithPin(payload: LoginWithPinPayload) {
  return apiRequest<LoginWithPinResponse>('/pin/login', {
    method: 'POST',
    body: payload,
  });
}
