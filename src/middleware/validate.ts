import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { BadRequestError } from '../lib/errors';

export const validate =
  (schema: AnyZodObject) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) Object.assign(req.query, parsed.query);
      if (parsed.params !== undefined) Object.assign(req.params, parsed.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          new BadRequestError('Validation failed', {
            issues: err.issues.map((i) => ({
              path: i.path.join('.'),
              message: i.message,
            })),
          }),
        );
        return;
      }
      next(err);
    }
  };
