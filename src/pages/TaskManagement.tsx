// client/src/components/Tasks/TaskManagement.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../services/api';
import { Task } from '../types/task';
import { ClientSelector } from '../components/Admin/ClientSelector';
import { NewTaskModal } from '../components/Tasks/NewTaskModal';
import { useAuth0 } from '@auth0/auth0-react';
import { KanbanBoard } from '../components/Tasks/KanbanBoard';
import { TaskTimelineTable } from '../components/Tasks/TaskTimelineTable';
import { TabMenu } from 'primereact/tabmenu';
import type { MenuItem } from 'primereact/menuitem';
import TaskCalendarView from '../components/Tasks/TaskCalendarView'; // default export

type ViewMode = 'kanban' | 'timeline' | 'calendar';

export const TaskManagement = () => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  // maintain tab by index (0=kanban, 1=timeline)
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    const saved = localStorage.getItem('task_view_index');
    const n = saved ? Number(saved) : 0;
    return Number.isFinite(n) && (n === 0 || n === 1) ? n : 0;
  });
  const view: ViewMode = activeIndex === 1 ? 'calendar' : 'kanban';
  const { isAuthenticated } = useAuth0();
  const { getAuthToken } = useAuthenticatedApi();

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      await getAuthToken();
      const { data } = await api.get('/users/me');
      return data;
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (userData?._id && (selectedClientId == null || selectedClientId === '')) {
      setSelectedClientId(userData._id);
    }
  }, [userData?._id, selectedClientId]);
  
  // Persist tab selection
  useEffect(() => {
    localStorage.setItem('task_view_index', String(activeIndex));
  }, [activeIndex]);

  const isAdmin = userData?.role === 'admin';
  const effectiveClientId = isAdmin
  ? (selectedClientId ?? userData?._id ?? null)
  : (userData?._id ?? null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', effectiveClientId],
    queryFn: async () => {
      await getAuthToken();
      if (!effectiveClientId) return [];
      const { data } = await api.get(`/tasks/user/${effectiveClientId}`);
      return data as Task[];
    },
    enabled: !!userData && !!effectiveClientId && isAuthenticated,
  });

  const items: MenuItem[] = useMemo(
    () => [
      { label: 'Kanban', icon: 'pi pi-th-large' },
      // { label: 'Timeline', icon: 'pi pi-calendar' },
      { label: 'Calendar', icon: 'pi pi-calendar-plus' },
    ],
    []
  );

  if (userLoading) return <div>Loading user data...</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="p-4 border-b bg-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold">Tasks</h1>

          {/* PrimeReact TabMenu */}
          <div className="w-full md:w-auto">
            <TabMenu
              model={items}
              activeIndex={activeIndex}
              onTabChange={(e) => setActiveIndex(e.index)}
              className="rounded-lg"
            />
          </div>

          {/* Create button */}
          {effectiveClientId && (
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700"
            >
              Create New Task
            </button>
          )}
        </div>
      </div>

      {/* Admin can switch which client they’re viewing; default is self */}
      {isAdmin && (
        <div className="p-4 border-b bg-white">
          <ClientSelector
            selectedClientId={selectedClientId}
            onClientSelect={(id) => setSelectedClientId(id)} // id is string|null (never '')
          />
        </div>
      )}

      {/* New Task modal */}
      {showNewTaskModal && (
        <NewTaskModal
          onClose={() => setShowNewTaskModal(false)}
          defaultAssigneeId={effectiveClientId}
        />
      )}

      {/* Content */}
      <div className="container mx-auto p-4">
        {isLoading ? (
          <div>Loading tasks…</div>
        ) : view === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            currentUserId={userData?._id}
            currentUserRole={userData?.role}
            effectiveClientId={effectiveClientId}
          />
        ) 
        // : view === 'timeline' ? (
        //   <TaskTimelineTable
        //     tasks={tasks as any}
        //     currentUserId={userData?._id}
        //     dateScale="day"
        //     rangeDays={28}
        //   />
        // ) 
        : (
          <TaskCalendarView
            tasks={tasks as any}
            currentUserId={userData?._id}
            currentUserRole={userData?.role}
            effectiveClientId={effectiveClientId}
          />
        )}
      </div>
    </div>
  );
};