import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../services/api';
import { useAuth0 } from '@auth0/auth0-react';
import { BarChart3, FolderTree, MessageSquare, Users } from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  totalTasks: number;
  totalMessages: number;
  totalFiles: number;
  clientGrowth: number;
  taskGrowth: number;
  messageGrowth: number;
  fileGrowth: number;
  unOpenedFiles: number;
}

function Dashboard() {
  const { getAuthToken } = useAuthenticatedApi();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0(); 
  const [authError, setAuthError] = useState<string | null>(null);

  // Fetch user data using React Query
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      await getAuthToken(); // Ensure we have a valid token
      const { data } = await api.get('/users/me');
      return data;
    },
    enabled: isAuthenticated, // Only run if authenticated
  });

  const isAdmin = userData?.role === 'admin';

  // Fetch dashboard stats
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      await getAuthToken(); // Ensure we have a valid token
      const { data } = await api.get('/dashboard/stats');
      return data;
    },
    enabled: isAuthenticated && !!userData, // Only run if authenticated and user data is available
  });

  // Handle authentication error
  if (authError) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        Authentication Error: {authError}
      </div>
    );
  }

  // Handle loading states
  if (authLoading || userLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle API errors
  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        Error: {(error as Error).message}
      </div>
    );
  }

  // Render dashboard
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome to Modern CRM</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Total Clients</h3>
              <Users className="text-blue-500" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalClients}</p>
          </div>
        )}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Active Tasks</h3>
            <BarChart3 className="text-purple-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalTasks}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Unread Messages</h3>
            <MessageSquare className="text-green-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalMessages}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Files</h3>
            <FolderTree className="text-orange-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.unOpenedFiles}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;