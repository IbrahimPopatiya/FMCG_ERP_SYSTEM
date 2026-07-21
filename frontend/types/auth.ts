export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  principal_type: "user" | "customer";
}
