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
  message: string;
  valid: boolean;
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
