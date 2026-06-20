"use client";

import { useState, type DragEvent } from "react";
import { CalendarDays, GripVertical, Plus } from "lucide-react";
import type { Subtask, Task, TeamMember } from "@/lib/mock-data";
import { Avatar, Badge, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";

type TaskStatus = Task["status"];

const columns: { key: TaskStatus; label: string; dot: string }[] = [
  { key: "todo", label: "To do", dot: "bg-slate-400" },
  { key: "in_progress", label: "In progress", dot: "bg-orange-500" },
  { key: "review", label: "Review", dot: "bg-violet-500" },
  { key: "done", label: "Done", dot: "bg-emerald-500" },
];

export function KanbanBoard({ initialTasks, subtasks, members }: { initialTasks: Task[]; subtasks: Subtask[]; members: TeamMember[] }) {
  const [taskItems, setTaskItems] = useState(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<TaskStatus | null>(null);

  function changeStatus(taskId: string, status: TaskStatus) {
    setTaskItems(current => current.map(task => task.id === taskId ? { ...task, status } : task));
  }

  function startDragging(event: DragEvent<HTMLDivElement>, taskId: string) {
    if ((event.target as HTMLElement).closest("select")) {
      event.preventDefault();
      return;
    }
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
  }

  function dropTask(event: DragEvent<HTMLDivElement>, status: TaskStatus) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || draggedTaskId;
    if (taskId) changeStatus(taskId, status);
    setDraggedTaskId(null);
    setActiveColumn(null);
  }

  return <div className="overflow-x-auto pb-2">
    <div className="grid min-w-[920px] grid-cols-4 gap-4">
      {columns.map(column => {
        const columnTasks = taskItems.filter(task => task.status === column.key);
        return <div
          key={column.key}
          onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setActiveColumn(column.key); }}
          onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setActiveColumn(null); }}
          onDrop={event => dropTask(event, column.key)}
          className={cn("min-h-[360px] rounded-xl border border-transparent bg-slate-100/70 p-3 transition-colors", activeColumn === column.key && "border-orange-300 bg-orange-50/70")}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><span className={cn("size-2 rounded-full", column.dot)} /><h3 className="text-sm font-semibold text-slate-800">{column.label}</h3><span className="text-xs text-slate-400">{columnTasks.length}</span></div>
            <Plus className="size-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {columnTasks.map(task => {
              const assignee = members.find(member => member.id === task.assigneeId);
              const taskSubtasks = subtasks.filter(subtask => subtask.taskId === task.id);
              return <Card
                key={task.id}
                draggable
                onDragStart={event => startDragging(event, task.id)}
                onDragEnd={() => { setDraggedTaskId(null); setActiveColumn(null); }}
                className={cn("cursor-grab shadow-sm transition active:cursor-grabbing hover:border-slate-300 hover:shadow-md", draggedTaskId === task.id && "opacity-40")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2"><Badge value={task.priority} /><GripVertical className="size-4 shrink-0 text-slate-400" aria-hidden="true" /></div>
                  <p className="mt-3 text-sm font-semibold leading-5 text-slate-900">{task.title}</p>
                  {taskSubtasks.length > 0 && <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">{taskSubtasks.map(subtask => { const subtaskAssignee = members.find(member => member.id === subtask.assigneeId); return <div key={subtask.id} className="flex items-center gap-2 text-xs"><span className={cn("size-1.5 shrink-0 rounded-full", subtask.status === "done" ? "bg-emerald-500" : "bg-slate-300")} /><span className={subtask.status === "done" ? "text-slate-400 line-through" : "text-slate-700"}>{subtask.title}</span>{subtaskAssignee && <span className="ml-auto shrink-0 text-slate-400">{subtaskAssignee.name.split(" ")[0]}</span>}</div>; })}</div>}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    {assignee ? <Avatar name={assignee.name} size="sm" /> : <span />}
                    <span className="flex items-center gap-1 text-[11px] text-slate-500"><CalendarDays className="size-3" />{task.dueDate}</span>
                  </div>
                  <label className="mt-3 block border-t border-slate-100 pt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Status
                    <select value={task.status} onChange={event => changeStatus(task.id, event.target.value as TaskStatus)} onPointerDown={event => event.stopPropagation()} className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-medium normal-case tracking-normal text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                      {columns.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
                    </select>
                  </label>
                </CardContent>
              </Card>;
            })}
            {columnTasks.length === 0 && <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">Drop a task here</div>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}
