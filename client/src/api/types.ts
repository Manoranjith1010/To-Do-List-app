export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResult {
  accessToken: string;
  user: User;
}

export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
