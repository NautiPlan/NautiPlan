import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Todo {
  text: string;
  completed: boolean;
  createdAt?: number;
}

interface TodoState {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (index: number) => void;
  removeTodo: (index: number) => void;
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],

      addTodo: (text) =>
        set((state) => ({
          todos: [
            ...state.todos,
            {
              text,
              completed: false,
              createdAt: Date.now(),
            },
          ],
        })),

      toggleTodo: (index) =>
        set((state) => ({
          todos: state.todos.map((todo, i) => (i === index ? { ...todo, completed: !todo.completed } : todo)),
        })),

      removeTodo: (index) =>
        set((state) => ({
          todos: state.todos.filter((_, i) => i !== index),
        })),
    }),
    {
      name: "todo-storage", // localStorage中的键名
    }
  )
);
