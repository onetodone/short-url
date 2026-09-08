import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Throttle } from '@nestjs/throttler'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { API_PREFIX } from '@/common/api-prefix'
import { AuthService } from '@/modules/auth/auth.service'
import type { AuthResponse, AuthResult } from '@/modules/auth/auth.types'
import { CurrentUser } from '@/modules/auth/current-user.decorator'
import { LoginDto } from '@/modules/auth/dto/login.dto'
import { RegisterDto } from '@/modules/auth/dto/register.dto'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

const REFRESH_COOKIE = 'refresh_token'
const DEFAULT_REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60
const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } }

@Controller(`${API_PREFIX}/auth`)
export class AuthController {
  private readonly cookiePath: string
  private readonly cookieSecure: boolean
  private readonly refreshMaxAgeSeconds: number

  constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    this.cookiePath = `/${API_PREFIX}/auth`
    this.cookieSecure = config.get<string>('app.nodeEnv', 'production') === 'production'
    this.refreshMaxAgeSeconds = parseDurationSeconds(
      config.get<string>('jwt.refreshExpiresIn', '7d'),
      DEFAULT_REFRESH_MAX_AGE_SECONDS,
    )
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle(AUTH_THROTTLE)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) reply: FastifyReply): Promise<AuthResponse> {
    const result = await this.auth.register(dto.email, dto.password)
    return this.finish(reply, result)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) reply: FastifyReply): Promise<AuthResponse> {
    const result = await this.auth.login(dto.email, dto.password)
    return this.finish(reply, result)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponse> {
    const token = this.extractRefreshToken(request)
    if (!token) {
      throw new UnauthorizedException('Missing refresh token')
    }

    const result = await this.auth.refresh(token)
    return this.finish(reply, result)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser('id') userId: string): Promise<{ id: string; email: string; createdAt: Date }> {
    return this.auth.profile(userId)
  }

  private finish(reply: FastifyReply, result: AuthResult): AuthResponse {
    reply.setCookie(REFRESH_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'strict',
      path: this.cookiePath,
      maxAge: this.refreshMaxAgeSeconds,
    })

    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }
  }

  private extractRefreshToken(request: FastifyRequest): string | null {
    const fromCookie = request.cookies?.[REFRESH_COOKIE]
    if (fromCookie) {
      return fromCookie
    }

    const body = request.body as { refreshToken?: unknown } | undefined
    return typeof body?.refreshToken === 'string' && body.refreshToken.length > 0 ? body.refreshToken : null
  }
}

function parseDurationSeconds(value: string, fallback: number): number {
  const match = /^(\d+)\s*(s|m|h|d)?$/.exec(value.trim())
  if (!match) {
    return fallback
  }

  const amount = Number(match[1])
  const unit = match[2] ?? 's'
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86_400 }
  return amount * multipliers[unit]
}
