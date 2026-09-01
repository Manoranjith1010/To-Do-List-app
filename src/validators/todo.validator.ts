import { z } from 'zod';

const uuid = z.string().uuid('Invalid id');

export const createTodoSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    description: z.string().trim().max(2000).optional(),
    completed: z.boolean().optional(),
  }),
});

export const updateTodoSchema = z.object({
  params: z.object({ id: uuid }),
  body: z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      description: z.string().trim().max(2000).nullable().optional(),
      completed: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const todoIdSchema = z.object({
  params: z.object({ id: uuid }),
});

export const completeTodoSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    completed: z.boolean().optional(),
  }),
});

export const listTodosSchema = z.object({
  query: z.object({
    completed: z.enum(['true', 'false']).optional(),
  }),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>['body'];
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>['body'];
