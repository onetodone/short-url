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
import { parseDurationSeconds } from '@/common/duration.util'
import { AuthService } from '@/modules/auth/auth.service'
import type { AuthResponse, AuthResult, RequestContext } from '@/modules/auth/auth.types'
import { CurrentUser } from '@/modules/auth/current-user.decorator'
import { LoginDto } from '@/modules/auth/dto/login.dto'
import { RegisterDto } from '@/modules/auth/dto/register.dto'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'
import { UserAgent } from '@/modules/auth/user-agent.decorator'
import { UserIp } from '@/modules/auth/user-ip.decorator'

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
  async register(
    @Body() dto: RegisterDto,
    @UserIp() ip: string | undefined,
    @UserAgent() userAgent: string | undefined,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponse> {
    const result = await this.auth.register(dto.email, dto.password, { ip, userAgent })
    return this.finish(reply, result)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  async login(
    @Body() dto: LoginDto,
    @UserIp() ip: string | undefined,
    @UserAgent() userAgent: string | undefined,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponse> {
    const result = await this.auth.login(dto.email, dto.password, { ip, userAgent })
    return this.finish(reply, result)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  async refresh(
    @Req() request: FastifyRequest,
    @UserIp() ip: string | undefined,
    @UserAgent() userAgent: string | undefined,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponse> {
    const token = request.cookies?.[REFRESH_COOKIE]
    if (!token) {
      throw new UnauthorizedException('Missing refresh token')
    }

    const ctx: RequestContext = { ip, userAgent }
    const result = await this.auth.refresh(token, ctx)
    return this.finish(reply, result)
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle(AUTH_THROTTLE)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser('sessionId') sessionId: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    await this.auth.logout(sessionId)
    reply.clearCookie(REFRESH_COOKIE, { path: this.cookiePath })
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle(AUTH_THROTTLE)
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser('id') userId: string, @Res({ passthrough: true }) reply: FastifyReply): Promise<void> {
    await this.auth.logoutAll(userId)
    reply.clearCookie(REFRESH_COOKIE, { path: this.cookiePath })
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
    }
  }
}
