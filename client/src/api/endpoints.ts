import { apiRequest } from './client';
import type { LoginResult, Todo, User } from './types';

export const authApi = {
  register: (input: { name: string; email: string; password: string }) =>
    apiRequest<User>('/auth/register', { method: 'POST', body: input, auth: false }),

  login: (input: { email: string; password: string }) =>
    apiRequest<LoginResult>('/auth/login', { method: 'POST', body: input, auth: false }),
};

export const todosApi = {
  list: () => apiRequest<Todo[]>('/todos'),

  get: (id: string) => apiRequest<Todo>(`/todos/${id}`),

  create: (input: { title: string; description?: string }) =>
    apiRequest<Todo>('/todos', { method: 'POST', body: input }),

  update: (id: string, input: { title?: string; description?: string | null; completed?: boolean }) =>
    apiRequest<Todo>(`/todos/${id}`, { method: 'PUT', body: input }),

  remove: (id: string) => apiRequest<void>(`/todos/${id}`, { method: 'DELETE' }),

  setComplete: (id: string, completed?: boolean) =>
    apiRequest<Todo>(`/todos/${id}/complete`, {
      method: 'PATCH',
      body: completed === undefined ? undefined : { completed },
    }),
};
