import { createZodDto, ZodDto } from 'nestjs-zod'
import { z } from 'zod'

const MAX_EMAIL_LENGTH = 254

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'A valid email address is required')
    .max(MAX_EMAIL_LENGTH, `Email must be at most ${MAX_EMAIL_LENGTH} characters`)
    .pipe(z.email('A valid email address is required')),
  password: z.string().min(1, 'Password is required'),
})

const LoginDtoBase: ZodDto<typeof loginSchema> = createZodDto(loginSchema)

export class LoginDto extends LoginDtoBase {}
