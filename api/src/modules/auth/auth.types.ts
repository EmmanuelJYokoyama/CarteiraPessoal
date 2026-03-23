export interface AuthTokenPayload {
  userId: string;
  email:  string;
}

export interface EmailConfirmTokenPayload {
  email: string;
  purpose: 'email-confirmation';
}

export interface LoginResponse {
  accessToken:  string;
  refreshToken: string;
}

export interface RegisterResponse {
  userId:  string;
  message: string;
}