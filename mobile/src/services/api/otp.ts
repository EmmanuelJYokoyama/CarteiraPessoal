import {apiRequest} from './client';

export type InitiateTwoFactorPayload = {
  phoneNumber: string;
};

export type InitiateTwoFactorResponse = {
  message: string;
};

export type ValidateOtpPayload = {
  code: string;
};

export type ValidateOtpResponse = {
  message: string;
  valid: boolean;
};

export async function initiateTwoFactor(payload: InitiateTwoFactorPayload) {
  return apiRequest<InitiateTwoFactorResponse>('/otp/initiate', {
    method: 'POST',
    body: payload,
  });
}

export async function validateOtp(payload: ValidateOtpPayload) {
  return apiRequest<ValidateOtpResponse>('/otp/validate', {
    method: 'POST',
    body: payload,
  });
}
