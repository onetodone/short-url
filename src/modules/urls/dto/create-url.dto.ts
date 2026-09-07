import { createZodDto, ZodDto } from 'nestjs-zod'
import { z } from 'zod'

const MAX_URL_LENGTH = 2048

export const urlValueSchema = z
  .string()
  .trim()
  .min(1, 'URL must not be empty')
  .max(MAX_URL_LENGTH, `URL must be at most ${MAX_URL_LENGTH} characters`)
  .pipe(z.url({ protocol: /^https?$/, error: 'URL must be a valid http(s) URL' }))
  .transform((value) => new URL(value).href)

export const createUrlSchema = z.object({
  url: urlValueSchema,
})

const CreateUrlDtoBase: ZodDto<typeof createUrlSchema> = createZodDto(createUrlSchema)

export class CreateUrlDto extends CreateUrlDtoBase {}
