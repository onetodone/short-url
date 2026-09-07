import { env } from '@/config/env'

/**
 * Normalised API prefix (no leading/trailing slashes), read at module-load time.
 * It can be interpolated into `@Controller()` decorators before DI is up.
 */
export const API_PREFIX = env.API_PREFIX
