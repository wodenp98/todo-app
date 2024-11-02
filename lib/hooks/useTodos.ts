import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Todo } from "@prisma/client";

interface CreateTodoInput {
  title: string;
  description: string;
}

interface UpdateTodoInput extends Partial<Todo> {
  id: number;
}

export const useTodos = () => {
  const queryClient = useQueryClient();

  // Fetch todos with error handling
  const {
    data: todos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Todo[], AxiosError>({
    queryKey: ["todos"],
    queryFn: async () => {
      const { data } = await axios.get("/api/todos");
      return data;
    },
  });

  // Create todo mutation with optimistic updates
  const createTodoMutation = useMutation({
    mutationFn: (newTodo: CreateTodoInput) =>
      axios.post<Todo>("/api/todos", newTodo),
    onMutate: async (newTodo) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      // Save previous todos
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"]);

      // Optimistically update the cache
      queryClient.setQueryData<Todo[]>(["todos"], (old = []) => [
        ...old,
        {
          id: Math.random(), // temporary ID
          ...newTodo,
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Todo,
      ]);

      return { previousTodos };
    },
    onError: (err, newTodo, context) => {
      // Revert the optimistic update
      queryClient.setQueryData(["todos"], context?.previousTodos);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  // Update todo mutation with optimistic updates
  const updateTodoMutation = useMutation({
    mutationFn: (todo: UpdateTodoInput) =>
      axios.patch<Todo>(`/api/todos/${todo.id}`, todo),
    onMutate: async (updatedTodo) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"]);

      queryClient.setQueryData<Todo[]>(["todos"], (old = []) =>
        old.map((todo) =>
          todo.id === updatedTodo.id ? { ...todo, ...updatedTodo } : todo
        )
      );

      return { previousTodos };
    },
    onError: (err, updatedTodo, context) => {
      queryClient.setQueryData(["todos"], context?.previousTodos);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  // Delete todo mutation with optimistic updates
  const deleteTodoMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/todos/${id}`),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"]);

      queryClient.setQueryData<Todo[]>(["todos"], (old = []) =>
        old.filter((todo) => todo.id !== deletedId)
      );

      return { previousTodos };
    },
    onError: (err, deletedId, context) => {
      queryClient.setQueryData(["todos"], context?.previousTodos);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  // Filter functions
  const getActiveTodos = () => todos.filter((todo) => !todo.completed);
  const getCompletedTodos = () => todos.filter((todo) => todo.completed);

  return {
    // Data and loading states
    todos,
    activeTodos: getActiveTodos(),
    completedTodos: getCompletedTodos(),
    isLoading,
    isError,
    error,

    // Actions
    createTodo: createTodoMutation.mutate,
    updateTodo: updateTodoMutation.mutate,
    deleteTodo: deleteTodoMutation.mutate,

    // Mutation states
    isCreating: createTodoMutation.isLoading,
    isUpdating: updateTodoMutation.isLoading,
    isDeleting: deleteTodoMutation.isLoading,

    // Refetch function
    refetch,
  };
};
