import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Tag,
  AlertCircle,
  CheckSquare,
  Square,
} from "lucide-react";
import { useTodoStore } from "./todo-store";

interface TaskModalProps {
  taskId: string | null;
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ taskId, onClose }) => {
  const { tasks, settings, addTask, updateTask, addLabel } = useTodoStore();

  const isEditing = !!taskId;
  const existingTask = taskId ? tasks[taskId] : null;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    status: "todo" as "todo" | "inprogress" | "done",
    dueDate: "",
    labels: [] as string[],
    subtasks: [] as any[],
    completed: false,
  });

  const [newSubtask, setNewSubtask] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [showNewLabelInput, setShowNewLabelInput] = useState(false);

  useEffect(() => {
    if (existingTask) {
      setFormData({
        title: existingTask.title,
        description: existingTask.description || "",
        priority: existingTask.priority,
        status: existingTask.status,
        dueDate: existingTask.dueDate ? existingTask.dueDate.split("T")[0] : "",
        labels: [...existingTask.labels],
        subtasks: [...existingTask.subtasks],
        completed: existingTask.completed,
      });
    }
  }, [existingTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) return;

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate
        ? new Date(formData.dueDate).toISOString()
        : undefined,
      labels: formData.labels,
      subtasks: formData.subtasks,
      completed: formData.completed,
    };

    if (isEditing && taskId) {
      updateTask(taskId, taskData);
    } else {
      addTask(taskData);
    }

    onClose();
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;

    const subtask: any = {
      id: Date.now().toString(),
      title: newSubtask.trim(),
      completed: false,
    };

    setFormData((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, subtask],
    }));

    setNewSubtask("");
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((subtask) =>
        subtask.id === subtaskId
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      ),
    }));
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((subtask) => subtask.id !== subtaskId),
    }));
  };

  const handleAddLabel = () => {
    if (!newLabel.trim()) return;

    const label = newLabel.trim();
    addLabel(label);

    if (!formData.labels.includes(label)) {
      setFormData((prev) => ({
        ...prev,
        labels: [...prev.labels, label],
      }));
    }

    setNewLabel("");
    setShowNewLabelInput(false);
  };

  const handleToggleLabel = (label: string) => {
    setFormData((prev) => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter((l) => l !== label)
        : [...prev.labels, label],
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg ${
          settings.darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 p-6 border-b flex items-center justify-between ${
            settings.darkMode
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-white"
          }`}
        >
          <h2 className="text-xl font-bold">
            {isEditing ? "Edit Task" : "Add New Task"}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              settings.darkMode
                ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                settings.darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
              placeholder="Enter task title..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                settings.darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
              placeholder="Enter task description..."
            />
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value as any,
                  }))
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  settings.darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as any,
                  }))
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  settings.darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Due Date</label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  settings.darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium mb-2">Labels</label>
            <div className="space-y-3">
              {/* Available Labels */}
              <div className="flex flex-wrap gap-2">
                {settings.availableLabels.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleToggleLabel(label)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      formData.labels.includes(label)
                        ? "bg-blue-500 text-white border-blue-500"
                        : settings.labelColors[label] ||
                          "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    <Tag size={12} className="inline mr-1" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Add New Label */}
              {showNewLabelInput ? (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddLabel()}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      settings.darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                    placeholder="Enter new label..."
                  />
                  <button
                    type="button"
                    onClick={handleAddLabel}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewLabelInput(false);
                      setNewLabel("");
                    }}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      settings.darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewLabelInput(true)}
                  className={`px-3 py-1 rounded-lg border-2 border-dashed transition-colors ${
                    settings.darkMode
                      ? "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                      : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Plus size={12} className="inline mr-1" />
                  Add New Label
                </button>
              )}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm font-medium mb-2">Subtasks</label>
            <div className="space-y-3">
              {/* Existing Subtasks */}
              {formData.subtasks.length > 0 && (
                <div className="space-y-2">
                  {formData.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border ${
                        settings.darkMode
                          ? "border-gray-600 bg-gray-700"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(subtask.id)}
                        className={`transition-colors ${
                          subtask.completed
                            ? "text-green-500"
                            : settings.darkMode
                            ? "text-gray-400 hover:text-gray-300"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {subtask.completed ? (
                          <CheckSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                      <span
                        className={`flex-1 ${
                          subtask.completed ? "line-through opacity-60" : ""
                        }`}
                      >
                        {subtask.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className={`p-1 rounded transition-colors ${
                          settings.darkMode
                            ? "text-gray-400 hover:text-red-400"
                            : "text-gray-400 hover:text-red-600"
                        }`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Subtask */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddSubtask()}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    settings.darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="Add a subtask..."
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2 rounded-lg transition-colors ${
                settings.darkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isEditing ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
