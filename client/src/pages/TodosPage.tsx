import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { todosApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { Todo } from '../api/types';

export default function TodosPage() {
  const { user, logout } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const showError = (err: unknown) =>
    setError(err instanceof ApiError ? err.message : 'Something went wrong');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTodos(await todosApi.list());
      setError(null);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const created = await todosApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setTodos((prev) => [created, ...prev]);
      setTitle('');
      setDescription('');
      setError(null);
    } catch (err) {
      showError(err);
    }
  }

  async function toggle(todo: Todo) {
    try {
      const updated = await todosApi.setComplete(todo.id, !todo.completed);
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      showError(err);
    }
  }

  async function remove(id: string) {
    try {
      await todosApi.remove(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      showError(err);
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Todos</h1>
          {user && <span className="muted">{user.name} · {user.email}</span>}
        </div>
        <button onClick={logout} className="secondary">
          Log out
        </button>
      </header>

      <form onSubmit={handleCreate} className="card">
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Description (optional)
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <button type="submit">Add todo</button>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : todos.length === 0 ? (
        <p className="muted">No todos yet. Add one above.</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.completed ? 'todo done' : 'todo'}>
              <label className="todo-main">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggle(todo)}
                />
                <span>
                  <strong>{todo.title}</strong>
                  {todo.description && <em> — {todo.description}</em>}
                </span>
              </label>
              <button className="danger" onClick={() => remove(todo.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
