import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, { message: 'Comment cannot be empty' }),
  taskId: z.string().trim().min(1, { message: 'Task ID is required' }),
});