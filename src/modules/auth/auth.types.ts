export interface AuthUser {
  id: string
  email: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResult extends AuthTokens {
  user: AuthUser
}

export interface AuthResponse {
  user: { id: string; email: string }
  accessToken: string
  refreshToken: string
}

export interface AccessTokenClaims {
  sub: string
  email: string
  type: 'access'
}

export interface RefreshTokenClaims {
  sub: string
  type: 'refresh'
}
