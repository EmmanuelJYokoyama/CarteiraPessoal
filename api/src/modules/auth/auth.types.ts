export interface AuthTokenPayload {
  userId: string;
  email:  string;
  type?: 'access' | 'refresh';
}

export interface TokenResponse {
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