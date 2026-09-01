import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/password';
import { signAccessToken } from '../lib/jwt';
import { ConflictError, UnauthorizedError } from '../lib/errors';
import type { RegisterInput, LoginInput } from '../validators/auth.validator';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
    select: publicUserSelect,
  });

  return user;
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await verifyPassword(user.passwordHash, input.password);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}
