import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  Clock,
  Tag,
  CheckSquare,
  Square,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useTodoStore } from "./todo-store";

// Get types from store
type Task = Parameters<ReturnType<typeof useTodoStore>["updateTask"]>[1] & {
  id: string;
};

interface TaskCardProps {
  task: any; // We'll use any for now to avoid type issues
  onEdit: (taskId: string) => void;
  isDragging?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  isDragging = false,
}) => {
  const { settings, toggleTask, deleteTask, toggleSubtask } = useTodoStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-gray-300";
    }
  };

  const getPriorityIcon = (priority: string) => {
    const size = 12;
    const className =
      priority === "high"
        ? "text-red-500"
        : priority === "medium"
        ? "text-yellow-500"
        : "text-green-500";

    return <AlertCircle size={size} className={className} />;
  };

  const completedSubtasks = task.subtasks.filter(
    (subtask) => subtask.completed
  ).length;
  const totalSubtasks = task.subtasks.length;

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  if (isDragging || isSortableDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-4 rounded-lg border-l-4 shadow-lg ${getPriorityColor(
          task.priority
        )} ${
          settings.darkMode
            ? "bg-gray-800 border border-gray-600"
            : "bg-white border border-gray-200"
        } opacity-90 transform rotate-3`}
      >
        <div className="font-medium">{task.title}</div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group p-4 rounded-lg border-l-4 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md ${getPriorityColor(
        task.priority
      )} ${
        settings.darkMode
          ? "bg-gray-800 border border-gray-600 hover:bg-gray-750"
          : "bg-white border border-gray-200 hover:bg-gray-50"
      }`}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start space-x-2 flex-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTask(task.id);
            }}
            className={`mt-0.5 transition-colors ${
              task.completed
                ? "text-green-500"
                : settings.darkMode
                ? "text-gray-400 hover:text-gray-300"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {task.completed ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>

          <div className="flex-1">
            <h4
              className={`font-medium ${
                task.completed ? "line-through opacity-60" : ""
              }`}
            >
              {task.title}
            </h4>
            {task.description && (
              <p
                className={`text-sm mt-1 ${
                  settings.darkMode ? "text-gray-400" : "text-gray-600"
                } ${task.completed ? "line-through opacity-60" : ""}`}
              >
                {task.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task.id);
            }}
            className={`p-1 rounded transition-colors ${
              settings.darkMode
                ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300"
                : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            }`}
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteTask(task.id);
            }}
            className={`p-1 rounded transition-colors ${
              settings.darkMode
                ? "hover:bg-gray-700 text-gray-400 hover:text-red-400"
                : "hover:bg-gray-100 text-gray-400 hover:text-red-600"
            }`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Task Metadata */}
      <div className="space-y-2">
        {/* Priority and Due Date */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {getPriorityIcon(task.priority)}
              <span className="capitalize">{task.priority}</span>
            </div>
          </div>

          {task.dueDate && (
            <div
              className={`flex items-center space-x-1 ${
                isOverdue
                  ? "text-red-500"
                  : settings.darkMode
                  ? "text-gray-400"
                  : "text-gray-600"
              }`}
            >
              <Calendar size={12} />
              <span>{format(new Date(task.dueDate), "MMM dd")}</span>
            </div>
          )}
        </div>

        {/* Subtasks Progress */}
        {totalSubtasks > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span
                className={
                  settings.darkMode ? "text-gray-400" : "text-gray-600"
                }
              >
                Subtasks: {completedSubtasks}/{totalSubtasks}
              </span>
              <span
                className={
                  settings.darkMode ? "text-gray-400" : "text-gray-600"
                }
              >
                {Math.round((completedSubtasks / totalSubtasks) * 100)}%
              </span>
            </div>
            <div
              className={`w-full h-1.5 rounded-full ${
                settings.darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{
                  width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                }}
              />
            </div>

            {/* Subtask List */}
            <div className="space-y-1 mt-2">
              {task.subtasks.slice(0, 3).map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center space-x-2 text-xs"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubtask(task.id, subtask.id);
                    }}
                    className={`transition-colors ${
                      subtask.completed
                        ? "text-green-500"
                        : settings.darkMode
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {subtask.completed ? (
                      <CheckSquare size={12} />
                    ) : (
                      <Square size={12} />
                    )}
                  </button>
                  <span
                    className={`${
                      subtask.completed ? "line-through opacity-60" : ""
                    } ${settings.darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {subtask.title}
                  </span>
                </div>
              ))}
              {task.subtasks.length > 3 && (
                <div
                  className={`text-xs ${
                    settings.darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  +{task.subtasks.length - 3} more...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Labels */}
        {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.map((label) => (
              <span
                key={label}
                className={`px-2 py-0.5 rounded-full text-xs flex items-center space-x-1 ${
                  settings.labelColors[label] || "bg-gray-100 text-gray-800"
                }`}
              >
                <Tag size={10} />
                <span>{label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Overdue indicator */}
      {isOverdue && (
        <div className="mt-2 flex items-center space-x-1 text-xs text-red-500">
          <Clock size={12} />
          <span>Overdue</span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
