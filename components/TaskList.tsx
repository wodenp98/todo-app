"use client";
import { useState } from "react";
import { Trash2, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { TodoFormModal } from "./TodoForm";
import { useTodos } from "@/lib/hooks/useTodos";
import { Todo } from "@prisma/client";

type FilterType = "all" | "active" | "completed";

export const TaskList: React.FC = () => {
  const {
    todos,
    activeTodos,
    completedTodos,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    // isError,
    // error,
    createTodo,
    updateTodo,
    deleteTodo,
    // refetch,
  } = useTodos();

  const [selectedTask, setSelectedTask] = useState<Todo | null>(null);
  const [editedDescription, setEditedDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState<FilterType>("all");

  // Combine filtering and searching
  const getFilteredTodos = () => {
    const filtered =
      currentFilter === "all"
        ? todos
        : currentFilter === "active"
        ? activeTodos
        : completedTodos;

    return filtered.filter(
      (todo) =>
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todo.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleTaskClick = (task: Todo) => {
    setSelectedTask(task);
    setEditedDescription(task.description || "");
  };

  const handleSave = async () => {
    if (selectedTask) {
      try {
        await updateTodo({
          id: selectedTask.id,
          description: editedDescription,
        });
        setSelectedTask((prev) =>
          prev ? { ...prev, description: editedDescription } : null
        );
      } catch (err) {
        // Error handling is managed by React Query
        console.log(err);
      }
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      await updateTodo({
        id: todo.id,
        completed: !todo.completed,
      });
    } catch (err) {
      // Error handling is managed by React Query
      console.log(err);
    }
  };

  const filteredTodos = getFilteredTodos();

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-800 p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Task Lists</h2>

          <TodoFormModal
            onSubmit={(title, description) =>
              createTodo({ title, description })
            }
            isLoading={isCreating}
          />
        </div>
        <nav className="space-y-2">
          <div
            className={`flex items-center justify-between py-2 px-4 rounded cursor-pointer ${
              currentFilter === "all" ? "bg-gray-800" : "hover:bg-gray-800"
            }`}
            onClick={() => setCurrentFilter("all")}
          >
            <span>All Tasks</span>
            <Badge>{todos.length}</Badge>
          </div>
          <div
            className={`flex items-center justify-between py-2 px-4 rounded cursor-pointer ${
              currentFilter === "active" ? "bg-gray-800" : "hover:bg-gray-800"
            }`}
            onClick={() => setCurrentFilter("active")}
          >
            <span>Active</span>
            <Badge>{activeTodos.length}</Badge>
          </div>
          <div
            className={`flex items-center justify-between py-2 px-4 rounded cursor-pointer ${
              currentFilter === "completed"
                ? "bg-gray-800"
                : "hover:bg-gray-800"
            }`}
            onClick={() => setCurrentFilter("completed")}
          >
            <span>Completed</span>
            <Badge>{completedTodos.length}</Badge>
          </div>
        </nav>
      </div>

      {/* Task List */}
      <div className="flex-1 border-r border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <Input
            type="text"
            placeholder="Search tasks..."
            className="bg-gray-800 border-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* {isError && (
          <Alert variant="destructive" className="m-4">
            <AlertDescription>
              {error?.message || "An error occurred. Please try again."}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )} */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No tasks found
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`p-4 border-b border-gray-800 cursor-pointer ${
                  selectedTask?.id === todo.id
                    ? "bg-gray-800"
                    : "hover:bg-gray-700"
                }`}
                onClick={() => handleTaskClick(todo)}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-semibold mb-2 ${
                      todo.completed ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {todo.title}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(todo);
                      }}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check
                          className={`h-4 w-4 ${
                            todo.completed ? "text-green-500" : "text-gray-500"
                          }`}
                        />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTodo(todo.id);
                      }}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-2">
                  {todo.description
                    ? todo.description.length > 100
                      ? `${todo.description.substring(0, 100)}...`
                      : todo.description
                    : "No description"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(todo.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Task Details */}
      <div className="w-1/2 p-6">
        {selectedTask ? (
          <>
            <h2 className="text-2xl font-bold mt-6">{selectedTask.title}</h2>
            <Textarea
              className="w-full h-64 mb-4 mt-4 bg-gray-800 border-gray-700"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              disabled={isUpdating}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  setEditedDescription(selectedTask.description || "")
                }
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a task to view details
          </div>
        )}
      </div>
    </div>
  );
};
