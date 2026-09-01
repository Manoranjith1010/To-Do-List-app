import { Request, Response } from 'express';
import * as todoService from '../services/todo.service';

function userId(req: Request): string {
  // authenticate middleware guarantees req.user is set before this runs
  return req.user!.id;
}

export async function create(req: Request, res: Response): Promise<void> {
  const todo = await todoService.createTodo(userId(req), req.body);
  res.status(201).json({ data: todo });
}

export async function list(req: Request, res: Response): Promise<void> {
  const completedParam = req.query.completed as string | undefined;
  const completed =
    completedParam === undefined ? undefined : completedParam === 'true';
  const todos = await todoService.listTodos(userId(req), { completed });
  res.status(200).json({ data: todos });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const todo = await todoService.getTodo(userId(req), req.params.id);
  res.status(200).json({ data: todo });
}

export async function update(req: Request, res: Response): Promise<void> {
  const todo = await todoService.updateTodo(userId(req), req.params.id, req.body);
  res.status(200).json({ data: todo });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await todoService.deleteTodo(userId(req), req.params.id);
  res.status(204).send();
}

export async function complete(req: Request, res: Response): Promise<void> {
  const todo = await todoService.setTodoCompletion(
    userId(req),
    req.params.id,
    req.body?.completed,
  );
  res.status(200).json({ data: todo });
}
