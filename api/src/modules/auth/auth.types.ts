export interface AuthTokenPayload {
  userId: string;
  email:  string;
}

export interface LoginResponse {
  accessToken:  string;
  refreshToken: string;
}

export interface RegisterResponse {
  userId:  string;
  message: string;
}