import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response): Promise<void> {
  const user = await authService.registerUser(req.body);
  res.status(201).json({ data: user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.loginUser(req.body);
  res.status(200).json({ data: result });
}
