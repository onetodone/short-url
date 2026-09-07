import { createZodDto, ZodDto } from 'nestjs-zod'
import { z } from 'zod'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export const listUrlsSchema = z.object({
  limit: z.coerce
    .number()
    .int('limit must be an integer')
    .min(1, 'limit must be at least 1')
    .max(MAX_LIMIT, `limit must be at most ${MAX_LIMIT}`)
    .default(DEFAULT_LIMIT),
  offset: z.coerce.number().int('offset must be an integer').min(0, 'offset must not be negative').default(0),
})

const ListUrlsDtoBase: ZodDto<typeof listUrlsSchema> = createZodDto(listUrlsSchema)

export class ListUrlsDto extends ListUrlsDtoBase {}
