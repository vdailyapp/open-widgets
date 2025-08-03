import React from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTodoStore } from "./todo-store";
import KanbanColumn from "./todo-kanban-column";
import TaskCard from "./todo-task-card";
import { useState } from "react";

interface KanbanViewProps {
  tasks: any[];
  onEditTask: (taskId: string) => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({ tasks, onEditTask }) => {
  const { settings, moveTask } = useTodoStore();
  const [activeTask, setActiveTask] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Group tasks by status
  const tasksByStatus = tasks.reduce((acc: any, task: any) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, any[]>);

  const handleDragStart = (event: any) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // Check if the drop target is a valid status
    if (["todo", "inprogress", "done"].includes(newStatus)) {
      moveTask(taskId, newStatus);
    }

    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full p-6 overflow-x-auto">
        <div className="flex space-x-6 h-full min-w-fit">
          {settings.kanbanColumns.map((column) => {
            const columnTasks = tasksByStatus[column.id] || [];

            return (
              <div key={column.id} className="flex-shrink-0 w-80">
                <SortableContext
                  items={columnTasks.map((task) => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <KanbanColumn
                    column={column}
                    tasks={columnTasks}
                    onEditTask={onEditTask}
                  />
                </SortableContext>
              </div>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
};

export default KanbanView;
