import { createZodDto, ZodDto } from 'nestjs-zod'
import { z } from 'zod'

const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 128
const MAX_EMAIL_LENGTH = 254

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'A valid email address is required')
    .max(MAX_EMAIL_LENGTH, `Email must be at most ${MAX_EMAIL_LENGTH} characters`)
    .pipe(z.email('A valid email address is required')),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters`),
})

const RegisterDtoBase: ZodDto<typeof registerSchema> = createZodDto(registerSchema)

export class RegisterDto extends RegisterDtoBase {}
