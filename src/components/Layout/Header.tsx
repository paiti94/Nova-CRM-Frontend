import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { LogOut, User } from 'lucide-react';

export const Header = () => {
  const { logout, user } = useAuth0();

  return (
    <header className="h-16 bg-white border-b fixed top-0 right-0 left-64 z-10">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">Welcome, {user?.name}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {/* Profile action */}}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <User size={20} />
          </button>
          
          <button
            onClick={() => logout()}
            className="p-2 hover:bg-gray-100 rounded-full text-red-600"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};