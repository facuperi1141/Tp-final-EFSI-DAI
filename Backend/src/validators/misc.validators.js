import { z } from 'zod';
import { CONTENT_TYPES, paginationQuery } from './common.js';

export const activityQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: paginationQuery.offset,
});

export const wrappedQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(() => new Date().getFullYear()),
});

export const searchQuery = z.object({
  q: z.string().trim().min(1).max(100),
  type: z.enum(CONTENT_TYPES).default('track'),
  limit: z.coerce.number().int().min(1).max(50).default(25),
  offset: z.coerce.number().int().min(0).max(1000).default(0),
});

export const chartQuery = z.object({
  type: z.enum(CONTENT_TYPES).default('track'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const externalDetailParams = z.object({
  type: z.enum(CONTENT_TYPES),
  externalId: z.string().regex(/^\d{1,20}$/, 'Id de Deezer inválido'),
});
