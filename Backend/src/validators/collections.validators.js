import { z } from 'zod';
import { contentRef, httpUrl, idSchema, optionalText, requireContentRef } from './common.js';

const name = z.string().trim().min(1).max(100);

export const createCollectionBody = z.object({
  name,
  description: optionalText(500),
  cover_url: httpUrl.nullable().optional(),
});

export const updateCollectionBody = z
  .object({
    name: name.optional(),
    description: optionalText(500),
    cover_url: httpUrl.nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'No mandaste ningún campo para actualizar');

export const addItemBody = z.object({ ...contentRef }).superRefine(requireContentRef);

export const itemParams = z.object({ id: idSchema, contentId: idSchema });
