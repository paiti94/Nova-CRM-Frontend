import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  Users, 
  MessageSquare, 
  FolderTree, 
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { api, useAuthenticatedApi } from '../../services/api';
import { useQuery } from '@tanstack/react-query';

export const Sidebar = () => {
  const { getAuthToken } = useAuthenticatedApi(); 
  const { isAuthenticated } = useAuth0();
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      await getAuthToken(); 
      const { data } = await api.get('/users/me'); 
      return data;
    },
    enabled: isAuthenticated, 
  });

  const isAdmin = userData?.role === 'admin';
  return (
    <div className="h-screen w-64 bg-gray-900 text-white p-4 fixed left-0 top-0">
      <div className="mb-8">
        <NavLink to="/dashboard" className="text-2xl font-bold">Modern CRM</NavLink>
      </div>
      
      <nav className="space-y-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 ${
              isActive ? 'bg-gray-800' : ''
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 ${
              isActive ? 'bg-gray-800' : ''
            }`
          }
        >
          <MessageSquare size={20} />
          <span>Messages</span>
        </NavLink>

        <NavLink
          to="/files"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 ${
              isActive ? 'bg-gray-800' : ''
            }`
          }
        >
          <FolderTree size={20} />
          <span>Files</span>
        </NavLink>

        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 ${
              isActive ? 'bg-gray-800' : ''
            }`
          }
        >
          <FolderTree size={20} />
          <span>Tasks Management</span>
        </NavLink>


        {isAdmin && (
          <NavLink
            to="/clients"
            className={({ isActive }) =>
              `flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 ${
                isActive ? 'bg-gray-800' : ''
              }`
            }
          >
            <Users size={20} />
            <span>Clients</span>
          </NavLink>
        )}

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 ${
              isActive ? 'bg-gray-800' : ''
            }`
          }
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>


        {/* {isAdmin && (<NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 ${
              isActive ? 'bg-gray-800' : ''
            }`
          }
        >
          <Settings size={20} />
          <span>Admin</span>
        </NavLink>
        )} */}
      </nav>
    </div>
  );
};