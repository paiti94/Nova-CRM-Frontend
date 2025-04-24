// client/src/components/Admin/TaskManagement.tsx
import React from 'react';

const tasks = [
  { id: 1, title: 'Prepare tax documents', status: 'To Do' },
  { id: 2, title: 'Review corporate tax return', status: 'In Progress' },
  { id: 3, title: 'Finalize bookkeeping for Q1', status: 'Done' },
  // Add more tasks as needed
];

export const TaskManagement = () => {
  const statuses = ['To Do', 'In Progress', 'Done'];

  return (
    <div className="task-management">
      <h2 className="text-xl font-semibold mb-4">Task Management</h2>
      <div className="kanban">
        {statuses.map(status => (
          <div key={status} className="kanban-column">
            <h3 className="text-lg font-semibold">{status}</h3>
            <ul>
              {tasks.filter(task => task.status === status).map(task => (
                <li key={task.id} className="task-item">{task.title}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};