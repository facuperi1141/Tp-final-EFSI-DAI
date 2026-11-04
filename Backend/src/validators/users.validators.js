import { z } from 'zod';
import { httpUrl, optionalText } from './common.js';

export const updateProfileBody = z
  .object({
    display_name: optionalText(60),
    bio: optionalText(500),
    avatar_url: httpUrl.nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'No mandaste ningún campo para actualizar');

export const preferencesBody = z
  .object({
    favorite_genres: z.array(z.string().trim().min(1).max(50)).max(20),
    language: z.string().trim().min(2).max(10),
    is_public: z.boolean(),
    yearly_goal: z.number().int().min(1).max(100000).nullable().default(null),
  })
  .strict();
