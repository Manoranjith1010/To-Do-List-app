import { Router } from 'express';
import * as todoController from '../controllers/todo.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/async-handler';
import {
  createTodoSchema,
  updateTodoSchema,
  todoIdSchema,
  completeTodoSchema,
  listTodosSchema,
} from '../validators/todo.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createTodoSchema), asyncHandler(todoController.create));
router.get('/', validate(listTodosSchema), asyncHandler(todoController.list));
router.get('/:id', validate(todoIdSchema), asyncHandler(todoController.getById));
router.put('/:id', validate(updateTodoSchema), asyncHandler(todoController.update));
router.delete('/:id', validate(todoIdSchema), asyncHandler(todoController.remove));
router.patch(
  '/:id/complete',
  validate(completeTodoSchema),
  asyncHandler(todoController.complete),
);

export default router;
