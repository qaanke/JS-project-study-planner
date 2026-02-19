import { useEffect, useReducer, useRef, useState } from "react";
import { createTodo } from "../Interfaces/todo";

const STORAGE_VERSION = 2;

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeTodo(t) {
  return {
    id:
      t?.id ??
      (crypto?.randomUUID
        ? crypto.randomUUID()
        : String(Date.now() + Math.random())),
    title: typeof t?.title === "string" ? t.title : "",
    type: t?.type ?? "other",
    isCompleted: !!t?.isCompleted,
    createdAt: t?.createdAt ?? new Date().toISOString(),
    dueDate: t?.dueDate ?? null,
    updatedAt: t?.updatedAt ?? t?.createdAt ?? new Date().toISOString(),
  };
}

function migrateStorage(parsed) {
  // v1: direkt array
  if (Array.isArray(parsed)) {
    return { version: STORAGE_VERSION, todos: parsed.map(normalizeTodo) };
  }

  // v2: {version, todos}
  if (parsed && typeof parsed === "object") {
    const v = Number(parsed.version || 1);
    const arr = Array.isArray(parsed.todos) ? parsed.todos : [];

    if (v <= 2) {
      return { version: STORAGE_VERSION, todos: arr.map(normalizeTodo) };
    }
  }

  return { version: STORAGE_VERSION, todos: [] };
}

function loadFromStorage(key, fallbackTodos) {
  const raw = localStorage.getItem(key);
  if (!raw) return { version: STORAGE_VERSION, todos: fallbackTodos };

  const parsed = safeParse(raw);
  const migrated = migrateStorage(parsed);
  return migrated;
}

function saveToStorage(key, state) {
  localStorage.setItem(key, JSON.stringify(state));
}

function todosReducer(state, action) {
  switch (action.type) {
    case "INIT": {
      return action.payload; // {version, todos}
    }

    case "ADD": {
      const { title, dueDate, type } = action.payload;
      const todo = createTodo(title, dueDate, type);
      const normalized = { ...todo, updatedAt: todo.createdAt };
      return { ...state, todos: [...state.todos, normalized] };
    }

    case "TOGGLE": {
      const id = action.payload;
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === id
            ? {
                ...t,
                isCompleted: !t.isCompleted,
                updatedAt: new Date().toISOString(),
              }
            : t
        ),
      };
    }

    // ✅ NEW: title/type/dueDate patch update
    case "UPDATE": {
      const { id, patch } = action.payload;

      return {
        ...state,
        todos: state.todos.map((t) => {
          if (t.id !== id) return t;

          const next = { ...t };

          if (patch && typeof patch === "object") {
            if (typeof patch.title === "string") next.title = patch.title;
            if (typeof patch.type === "string") next.type = patch.type;
            if (patch.dueDate === null || typeof patch.dueDate === "string") {
              next.dueDate = patch.dueDate;
            }
          }

          next.updatedAt = new Date().toISOString();
          return next;
        }),
      };
    }

    case "DELETE": {
      const id = action.payload;
      return { ...state, todos: state.todos.filter((t) => t.id !== id) };
    }

    case "RESTORE": {
      const todo = action.payload;
      if (state.todos.some((t) => t.id === todo.id)) return state;
      return { ...state, todos: [...state.todos, normalizeTodo(todo)] };
    }

    case "MARK_ALL": {
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.isCompleted
            ? t
            : { ...t, isCompleted: true, updatedAt: new Date().toISOString() }
        ),
      };
    }

    case "CLEAR_COMPLETED": {
      return { ...state, todos: state.todos.filter((t) => !t.isCompleted) };
    }

    default:
      return state;
  }
}

export function useTodos({ storageKey, seedTodos }) {
  const [state, dispatch] = useReducer(todosReducer, {
    version: STORAGE_VERSION,
    todos: [],
  });

  const [undo, setUndo] = useState(null); // { todo, timeoutId }
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const loaded = loadFromStorage(storageKey, seedTodos);
    dispatch({ type: "INIT", payload: loaded });

    try {
      saveToStorage(storageKey, loaded);
    } catch {}
  }, [storageKey, seedTodos]);

  useEffect(() => {
    try {
      saveToStorage(storageKey, state);
    } catch {}
  }, [storageKey, state]);

  const addTodo = (title, dueDate, type) =>
    dispatch({ type: "ADD", payload: { title, dueDate, type } });

  const toggleTodo = (id) => dispatch({ type: "TOGGLE", payload: id });

  // ✅ NEW signature: updateTodo(id, patchObject)
  const updateTodo = (id, patch) =>
    dispatch({ type: "UPDATE", payload: { id, patch } });

  const markAllCompleted = () => dispatch({ type: "MARK_ALL" });

  const clearCompleted = () => dispatch({ type: "CLEAR_COMPLETED" });

  const deleteTodo = (id) => {
    const todo = state.todos.find((t) => t.id === id);
    if (!todo) return;

    dispatch({ type: "DELETE", payload: id });

    if (undo?.timeoutId) clearTimeout(undo.timeoutId);

    const timeoutId = window.setTimeout(() => setUndo(null), 5000);
    setUndo({ todo, timeoutId });
  };

  const undoDelete = () => {
    if (!undo?.todo) return;
    if (undo.timeoutId) clearTimeout(undo.timeoutId);
    dispatch({ type: "RESTORE", payload: undo.todo });
    setUndo(null);
  };

  return {
    todos: state.todos,
    addTodo,
    deleteTodo,
    toggleTodo,
    updateTodo,
    markAllCompleted,
    clearCompleted,
    undo,
    undoDelete,
  };
}
