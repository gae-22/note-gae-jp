import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().max(200).default(''),
  content: z.string().default(''),
  isPublic: z.boolean().default(false),
  tagIds: z.array(z.string()).default([]),
});

export const updateNoteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().optional(),
  isPublic: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});
