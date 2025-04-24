// client/src/pages/AdminPage.tsx
import React, { useState } from 'react';
import { TaskManagement } from '../components/Admin/TaskManagement';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('clients'); // Default to clients tab

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          Client List
        </button>
        <button
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Task Management
        </button>
      </div>

      {activeTab === 'tasks' && <TaskManagement />}
    </div>
  );
};

export default AdminPage;