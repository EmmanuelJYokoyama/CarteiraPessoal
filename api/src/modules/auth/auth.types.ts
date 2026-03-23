export interface AuthTokenPayload {
  userId: string;
  email:  string;
  type?: 'access' | 'refresh';
}

export interface EmailConfirmTokenPayload {
  email: string;
  purpose: 'email-confirmation';
}

export interface LoginResponse {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number; // em segundos
}

export interface LoginResponse extends TokenResponse {}

export interface RegisterResponse {
  userId:  string;
  message: string;
}

export interface RefreshTokenResponse {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;
}