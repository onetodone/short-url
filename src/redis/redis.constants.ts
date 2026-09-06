import { Inject } from '@nestjs/common'

export const REDIS = Symbol('REDIS_CLIENT')

export const InjectRedis = (): ReturnType<typeof Inject> => Inject(REDIS)
