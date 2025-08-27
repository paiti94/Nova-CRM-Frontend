import React from 'react';
import type { Task } from '../../types/task';

interface TaskListProps {
  tasks: Task[];
  selectedTask: Task | null;
  onSelect: (t: Task) => void;
  title?: string;
  loading?: boolean;
  onRefresh?: () => void;
}

export function TaskList({ tasks, selectedTask, onSelect, title = 'Tasks', loading, onRefresh }: TaskListProps) {
  return (
    <div className="w-1/3 bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {onRefresh && (
          <button
            className="text-sm rounded border px-3 py-1 disabled:opacity-60"
            onClick={onRefresh}
            disabled={!!loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        )}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-2">
          {tasks?.map((task) => (
            <div
              key={task._id}
              className={`p-3 rounded-lg cursor-pointer ${
                selectedTask?._id === task._id ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => onSelect(task)}
            >
                <h3 className="font-medium flex items-center gap-2">
                 {task.title}
                 {task.source === 'outlook' && (
                   <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Outlook</span>
                 )}
                </h3>
              <p className="text-sm text-gray-600">Status: {task.status}</p>
            </div>
          ))}
          {!tasks?.length && <div className="text-gray-500">No tasks found.</div>}
        </div>
      )}
    </div>
  );
}
