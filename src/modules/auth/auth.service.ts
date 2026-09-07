import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService, type JwtSignOptions } from '@nestjs/jwt'
import bcrypt from 'bcryptjs'

import { PrismaService } from '@/database/prisma.service'
import type { AuthResult, AuthUser, RefreshTokenClaims } from '@/modules/auth/auth.types'
import { Prisma } from '@prisma-client'

const BCRYPT_COST = 12

// A valid pre-computed hash compared against when the account does not exist, so a
// failed login costs roughly the same time whether or not the email is registered.
const TIMING_GUARD_HASH = '$2b$12$aOsoBnv7iRSo.MqU2AmZwuNTXjLNKisRV3PMfTwFj6YZ3G/t53Puu'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  private readonly accessTtl: JwtSignOptions['expiresIn']
  private readonly refreshTtl: JwtSignOptions['expiresIn']

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessTtl = config.get<string>('jwt.expiresIn', '15m') as JwtSignOptions['expiresIn']
    this.refreshTtl = config.get<string>('jwt.refreshExpiresIn', '7d') as JwtSignOptions['expiresIn']
  }

  async register(email: string, password: string): Promise<AuthResult> {
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST)

    try {
      const user = await this.prisma.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true },
      })
      this.logger.log(`Registered new user <${user.email}>`)
      return this.issue(user)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email is already registered')
      }
      throw error
    }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    })

    const matches = await bcrypt.compare(password, user?.passwordHash ?? TIMING_GUARD_HASH)

    if (!user || !matches) {
      throw new UnauthorizedException('Invalid email or password')
    }

    return this.issue({ id: user.id, email: user.email })
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let claims: RefreshTokenClaims
    try {
      claims = await this.jwt.verifyAsync<RefreshTokenClaims>(refreshToken)
    } catch (error) {
      this.logger.debug(`Refresh token rejected: ${(error as Error).message}`)
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    if (claims.type !== 'refresh' || typeof claims.sub !== 'string') {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, email: true },
    })

    if (!user) {
      throw new UnauthorizedException('Account no longer exists')
    }

    return this.issue(user)
  }

  async profile(userId: string): Promise<{ id: string; email: string; createdAt: Date }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true },
    })

    if (!user) {
      throw new UnauthorizedException('Account no longer exists')
    }

    return user
  }

  private async issue(user: AuthUser): Promise<AuthResult> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync({ sub: user.id, email: user.email, type: 'access' }, { expiresIn: this.accessTtl }),
      this.jwt.signAsync({ sub: user.id, type: 'refresh' }, { expiresIn: this.refreshTtl }),
    ])

    return { user, accessToken, refreshToken }
  }
}
