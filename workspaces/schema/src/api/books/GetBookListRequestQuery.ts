import { z } from 'zod';

export const GetBookListRequestQuerySchema = z.object({
  authorId: z.string().optional(),
  authorName: z.string().optional(),
  limit: z.coerce.number().optional(),
  name: z.string().optional(),
  offset: z.coerce.number().optional(),
  keyword: z.coerce.string().optional(),
  zenhira: z.coerce.string().optional(),
  hanhira: z.coerce.string().optional(),
  zenkata: z.coerce.string().optional(),
  hankata: z.coerce.string().optional()
});

export type GetBookListRequestQuery = z.infer<typeof GetBookListRequestQuerySchema>;
