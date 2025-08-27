// // client/src/pages/OutlookTasks.tsx
// import { useQuery } from '@tanstack/react-query';
// import { api, useAuthenticatedApi } from '../../services/api';
// import { useAuth0 } from '@auth0/auth0-react';
// import { useState } from 'react';
// import type { Task } from '../../types/task';
// import { TaskList } from './TaskList';
// import { TaskDetail } from './TaskDetail';
// import { UploadModal } from '../Files/UploadModal';

// export default function OutlookTasks() {
//   const { isAuthenticated } = useAuth0();
//   const { getAuthToken } = useAuthenticatedApi();
//   const [selectedTask, setSelectedTask] = useState<Task | null>(null);

//   const { data: user } = useQuery({
//     queryKey: ['user'],
//     queryFn: async () => (await api.get('/users/me')).data,
//     enabled: isAuthenticated,
//   });

//   const { data: tasks = [], isLoading } = useQuery({
//     queryKey: ['tasks', 'outlook'],
//     queryFn: async () => {
//       await getAuthToken();
//       const { data } = await api.get(`/tasks`, { params: { source: 'outlook' } });
//       return data as Task[];
//     },
//     enabled: isAuthenticated,
//   });

//   return (
//     <div className="h-full flex flex-col">
//       <div className="p-4 border-b bg-white flex justify-between items-center">
//         <h1 className="text-2xl font-semibold">Outlook Tasks</h1>
//       </div>

//       <div className="container mx-auto p-4">
//         <div className="flex gap-4">
//           <TaskList
//             tasks={tasks}
//             selectedTask={selectedTask}
//             onSelect={setSelectedTask}
//             loading={isLoading}
//           />

//           {selectedTask && (
//             <TaskDetail
//               task={selectedTask}
//               effectiveClientId={user?._id}
//               userIdForDeleteCheck={user?._id}
//               UploadModal={UploadModal}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../../services/api';
import { useAuth0 } from '@auth0/auth0-react';
import type { Task } from '../../types/task';
import { TaskList } from '../../components/Tasks/TaskList';
import { TaskDetail } from '../../components/Tasks/TaskDetail';
import { UploadModal } from '../../components/Files/UploadModal';

export default function OutlookTasksPage() {
  const { isAuthenticated } = useAuth0();
  const { getAuthToken } = useAuthenticatedApi();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => (await api.get('/users/me')).data,
    enabled: isAuthenticated,
  });

  // Create/renew subscription whenever connected (user.msConnected must be true)
//   useEffect(() => {
//     if (!isAuthenticated || !user?.msConnected) return;
//     (async () => {
//       try {
//         await getAuthToken();
//         await api.post('/microsoft/subscribe-inbox');
//       } catch (e) {
//         console.error('subscribe-inbox failed', e);
//       }
//     })();
//   }, [isAuthenticated, user?.msConnected, getAuthToken]);

  const {
    data: tasks = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['tasks', 'outlook'],
    queryFn: async () => {
      await getAuthToken();
      const { data } = await api.get('/tasks', { params: { source: 'outlook' } });
      return data as Task[];
    },
    enabled: isAuthenticated,
    // Optional: light auto-refresh so new tasks appear shortly after webhook insert
    refetchInterval: user?.msConnected ? 15000 : false, // 15s; adjust or remove if you add websockets later
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-white flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Outlook Tasks</h1>
      </div>

      <div className="container mx-auto p-4">
        <div className="flex gap-4">
          <TaskList
            tasks={tasks}
            selectedTask={selectedTask}
            onSelect={setSelectedTask}
            loading={isLoading}
            onRefresh={() => refetch()}
          />
          {selectedTask && (
             <TaskDetail
             task={selectedTask}
             effectiveClientId={user?._id}
             currentUserId={user?._id}
             currentUserRole={user?.role} // 'admin' | 'user'
             />
          )}
        </div>
      </div>
    </div>
  );
}
