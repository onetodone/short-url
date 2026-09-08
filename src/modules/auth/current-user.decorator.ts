import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'

import type { AuthPrincipal } from '@/modules/auth/auth.types'

export const CurrentUser = createParamDecorator(
  (field: keyof AuthPrincipal | undefined, context: ExecutionContext): AuthPrincipal | string => {
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const user = request.user

    if (!user) {
      throw new UnauthorizedException('Authentication required')
    }

    return field ? user[field] : user
  },
)
