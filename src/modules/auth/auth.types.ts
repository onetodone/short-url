export interface AuthUser {
  id: string
  email: string
}

export interface AuthPrincipal extends AuthUser {
  sessionId: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResult extends AuthTokens {
  user: AuthUser
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
}

export interface RequestContext {
  ip?: string
  userAgent?: string
}

export interface AccessTokenClaims {
  sub: string
  email: string
  type: 'access'
  sid: string
}
