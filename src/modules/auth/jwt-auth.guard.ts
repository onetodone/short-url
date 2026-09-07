import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { FastifyRequest } from 'fastify'

import type { AccessTokenClaims } from '@/modules/auth/auth.types'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name)

  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const token = this.extractBearerToken(request)

    if (!token) {
      throw new UnauthorizedException('Missing or malformed Authorization header')
    }

    let claims: AccessTokenClaims
    try {
      claims = await this.jwt.verifyAsync<AccessTokenClaims>(token)
    } catch (error) {
      this.logger.debug(`Access token rejected: ${(error as Error).message}`)
      throw new UnauthorizedException('Invalid or expired access token')
    }

    if (claims.type !== 'access' || typeof claims.sub !== 'string' || typeof claims.email !== 'string') {
      throw new UnauthorizedException('Invalid or expired access token')
    }

    const principal = { id: claims.sub, email: claims.email }
    request.user = principal
    request.raw.user = principal
    return true
  }

  private extractBearerToken(request: FastifyRequest): string | null {
    const header = request.headers.authorization
    if (!header) {
      return null
    }

    const [scheme, value] = header.split(' ')
    if (scheme?.toLowerCase() !== 'bearer' || !value) {
      return null
    }

    return value.trim()
  }
}
