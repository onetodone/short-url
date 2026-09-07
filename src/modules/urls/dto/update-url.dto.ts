import { createZodDto, ZodDto } from 'nestjs-zod'
import { z } from 'zod'

import { urlValueSchema } from '@/modules/urls/dto/create-url.dto'

export const updateUrlSchema = z.object({
  url: urlValueSchema,
})

const UpdateUrlDtoBase: ZodDto<typeof updateUrlSchema> = createZodDto(updateUrlSchema)

export class UpdateUrlDto extends UpdateUrlDtoBase {}
