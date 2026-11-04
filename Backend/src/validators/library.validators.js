import { z } from 'zod';
import { CONTENT_SOURCES, CONTENT_TYPES, LIBRARY_STATUSES, contentInput, paginationQuery } from './common.js';

const rating = z.number().int().min(1).max(5);

export const listLibraryQuery = z.object({
  status: z.enum(LIBRARY_STATUSES).optional(),
  favorite: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  type: z.enum(CONTENT_TYPES).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['recent', 'oldest', 'title', 'artist', 'rating', 'updated']).default('recent'),
  ...paginationQuery,
});

export const addLibraryBody = z.object({
  content: contentInput,
  status: z.enum(LIBRARY_STATUSES).default('quiero_escuchar'),
  is_favorite: z.boolean().default(false),
  rating: rating.nullable().default(null),
});

export const updateLibraryBody = z
  .object({
    status: z.enum(LIBRARY_STATUSES).optional(),
    is_favorite: z.boolean().optional(),
    rating: rating.nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'No mandaste ningún campo para actualizar');

export const byExternalParams = z.object({
  source: z.enum(CONTENT_SOURCES),
  externalId: z.string().trim().min(1).max(64),
});
