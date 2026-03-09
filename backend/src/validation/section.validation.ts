import { z } from 'zod';

export const sectionNameSchema = z.string().trim().min(1, { message: 'Section name is required' }).max(255);

// 👇 This single line is what validates your DELETE requests!
export const sectionIdSchema = z.string().trim().min(1);

export const createSectionSchema = z.object({
  name: sectionNameSchema,
});

export const updateSectionSchema = z.object({
  name: sectionNameSchema,
});