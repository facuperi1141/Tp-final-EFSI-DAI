import { z } from 'zod';
import { contentRef, requireContentRef } from './common.js';

const body = z.string().trim().min(1).max(5000);

export const createReviewBody = z
  .object({ ...contentRef, body })
  .superRefine(requireContentRef);

export const updateReviewBody = z.object({ body }).strict();
