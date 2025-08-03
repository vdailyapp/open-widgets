import React from "react";
import { format, isToday, isTomorrow, isYesterday, isThisWeek } from "date-fns";
import { Calendar, SortAsc, SortDesc, Tag, AlertCircle } from "lucide-react";
import { useTodoStore } from "./todo-store";
import TaskCard from "./todo-task-card";

interface ListViewProps {
  tasks: any[];
  onEditTask: (taskId: string) => void;
}

const ListView: React.FC<ListViewProps> = ({ tasks, onEditTask }) => {
  const { settings, updateSettings } = useTodoStore();

  const formatDateGroup = (date: string | undefined): string => {
    if (!date) return "No Due Date";

    const taskDate = new Date(date);

    if (isToday(taskDate)) return "Today";
    if (isTomorrow(taskDate)) return "Tomorrow";
    if (isYesterday(taskDate)) return "Yesterday";
    if (isThisWeek(taskDate)) return format(taskDate, "EEEE");

    return format(taskDate, "MMM dd, yyyy");
  };

  const sortTasks = (tasksToSort: any[]): any[] => {
    return [...tasksToSort].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (settings.listSortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "dueDate":
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          break;
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case "createdAt":
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (settings.listSortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const groupTasks = (tasksToGroup: any[]): Record<string, any[]> => {
    const grouped = tasksToGroup.reduce((acc, task) => {
      let groupKey: string;

      switch (settings.listGroupBy) {
        case "date":
          groupKey = formatDateGroup(task.dueDate);
          break;
        case "priority":
          groupKey =
            task.priority.charAt(0).toUpperCase() +
            task.priority.slice(1) +
            " Priority";
          break;
        case "status":
          const statusLabels = {
            todo: "To Do",
            inprogress: "In Progress",
            done: "Done",
          };
          groupKey = statusLabels[task.status];
          break;
        case "labels":
          groupKey = task.labels.length > 0 ? task.labels[0] : "No Labels";
          break;
        default:
          groupKey = "All Tasks";
          break;
      }

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(task);
      return acc;
    }, {} as Record<string, any[]>);

    // Sort tasks within each group
    Object.keys(grouped).forEach((key) => {
      grouped[key] = sortTasks(grouped[key]);
    });

    return grouped;
  };

  const handleSortChange = (sortBy: typeof settings.listSortBy) => {
    const newOrder =
      settings.listSortBy === sortBy && settings.listSortOrder === "desc"
        ? "asc"
        : "desc";
    updateSettings({
      listSortBy: sortBy,
      listSortOrder: newOrder,
    });
  };

  const groupedTasks = groupTasks(tasks);
  const groupKeys = Object.keys(groupedTasks);

  // Sort group keys for consistent ordering
  const sortedGroupKeys = groupKeys.sort((a, b) => {
    if (settings.listGroupBy === "date") {
      // Special ordering for date groups
      const dateOrder = ["Overdue", "Today", "Tomorrow", "Yesterday"];
      const aIndex = dateOrder.indexOf(a);
      const bIndex = dateOrder.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // For other dates, compare chronologically
      if (a === "No Due Date") return 1;
      if (b === "No Due Date") return -1;

      return a.localeCompare(b);
    }

    if (settings.listGroupBy === "priority") {
      const priorityOrder = [
        "High Priority",
        "Medium Priority",
        "Low Priority",
      ];
      return priorityOrder.indexOf(a) - priorityOrder.indexOf(b);
    }

    return a.localeCompare(b);
  });

  const getSortIcon = (sortBy: typeof settings.listSortBy) => {
    if (settings.listSortBy !== sortBy) return null;
    return settings.listSortOrder === "asc" ? (
      <SortAsc size={16} />
    ) : (
      <SortDesc size={16} />
    );
  };

  const getGroupIcon = (groupKey: string) => {
    if (settings.listGroupBy === "date") {
      return <Calendar size={16} />;
    }
    if (settings.listGroupBy === "priority") {
      return <AlertCircle size={16} />;
    }
    if (settings.listGroupBy === "labels") {
      return <Tag size={16} />;
    }
    return null;
  };

  const getGroupColor = (groupKey: string) => {
    if (settings.listGroupBy === "priority") {
      if (groupKey.includes("High")) return "text-red-600 border-red-200";
      if (groupKey.includes("Medium"))
        return "text-yellow-600 border-yellow-200";
      if (groupKey.includes("Low")) return "text-green-600 border-green-200";
    }

    if (settings.listGroupBy === "date") {
      if (groupKey === "Today") return "text-blue-600 border-blue-200";
      if (groupKey === "Tomorrow") return "text-green-600 border-green-200";
      if (groupKey === "Overdue") return "text-red-600 border-red-200";
    }

    return settings.darkMode
      ? "text-gray-300 border-gray-600"
      : "text-gray-700 border-gray-200";
  };

  return (
    <div className="h-full flex flex-col">
      {/* List Controls */}
      <div
        className={`p-4 border-b ${
          settings.darkMode
            ? "border-gray-700 bg-gray-800"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Group By */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Group by:</label>
            <select
              value={settings.listGroupBy}
              onChange={(e) =>
                updateSettings({ listGroupBy: e.target.value as any })
              }
              className={`px-3 py-1 rounded border text-sm ${
                settings.darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="status">Status</option>
              <option value="date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="labels">Labels</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Sort by:</label>
            <div className="flex space-x-1">
              {[
                { key: "createdAt", label: "Created" },
                { key: "dueDate", label: "Due Date" },
                { key: "priority", label: "Priority" },
                { key: "title", label: "Title" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSortChange(key as any)}
                  className={`px-3 py-1 rounded text-sm flex items-center space-x-1 transition-colors ${
                    settings.listSortBy === key
                      ? settings.darkMode
                        ? "bg-blue-600 text-white"
                        : "bg-blue-500 text-white"
                      : settings.darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{label}</span>
                  {getSortIcon(key as any)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Groups */}
      <div className="flex-1 overflow-y-auto p-6">
        {sortedGroupKeys.length === 0 ? (
          <div
            className={`text-center py-12 ${
              settings.darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <p className="text-lg mb-2">No tasks found</p>
            <p className="text-sm">Create your first task to get started!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedGroupKeys.map((groupKey) => {
              const groupTasks = groupedTasks[groupKey];

              return (
                <div key={groupKey} className="space-y-4">
                  {/* Group Header */}
                  <div
                    className={`flex items-center space-x-2 pb-2 border-b ${getGroupColor(
                      groupKey
                    )}`}
                  >
                    {getGroupIcon(groupKey)}
                    <h3 className="font-semibold text-lg">{groupKey}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        settings.darkMode
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {groupTasks.length}
                    </span>
                  </div>

                  {/* Group Tasks */}
                  <div className="grid gap-4">
                    {groupTasks.map((task) => (
                      <div
                        key={task.id}
                        className="transition-all duration-200 hover:scale-[1.02]"
                      >
                        <TaskCard task={task} onEdit={onEditTask} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListView;
