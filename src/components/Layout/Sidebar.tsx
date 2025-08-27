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

  const handleOutlookConnect = () => {
    window.location.href = `${api.defaults.baseURL}/microsoft/login`;
  };
  

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

         {isAdmin && (<NavLink
          to="/outlook"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 ${
              isActive ? 'bg-gray-800' : ''
            }`
          }
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5zm14 2v4.18A3 3 0 0017 7c-1.65 0-3 1.35-3 3s1.35 3 3 3a3 3 0 002-0.82V19H5V5h14zm-4 5a1 1 0 110 2 1 1 0 010-2z"/>
          </svg>
          <span>Outlook Integration</span>
        </NavLink>
        )}
      </nav>
    </div>
  );
};