import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import type { CreateTodoInput, UpdateTodoInput } from '../validators/todo.validator';

interface ListOptions {
  completed?: boolean;
}

export async function createTodo(userId: string, input: CreateTodoInput) {
  return prisma.todo.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      completed: input.completed ?? false,
    },
  });
}

export async function listTodos(userId: string, options: ListOptions = {}) {
  return prisma.todo.findMany({
    where: {
      userId,
      ...(options.completed === undefined ? {} : { completed: options.completed }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getOwnedTodoOrThrow(userId: string, id: string) {
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo || todo.userId !== userId) {
    throw new NotFoundError('Todo not found');
  }
  return todo;
}

export async function getTodo(userId: string, id: string) {
  return getOwnedTodoOrThrow(userId, id);
}

export async function updateTodo(userId: string, id: string, input: UpdateTodoInput) {
  await getOwnedTodoOrThrow(userId, id);
  return prisma.todo.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.completed !== undefined ? { completed: input.completed } : {}),
    },
  });
}

export async function deleteTodo(userId: string, id: string) {
  await getOwnedTodoOrThrow(userId, id);
  await prisma.todo.delete({ where: { id } });
}

export async function setTodoCompletion(userId: string, id: string, completed?: boolean) {
  const todo = await getOwnedTodoOrThrow(userId, id);
  const next = completed === undefined ? !todo.completed : completed;
  return prisma.todo.update({ where: { id }, data: { completed: next } });
}
