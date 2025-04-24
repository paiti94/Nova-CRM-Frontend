import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../../services/api'; // Import useAuthenticatedApi
import { useAuth0 } from '@auth0/auth0-react';

interface Client {
  _id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
}

interface ClientSelectorProps {
  selectedClientId: string | null;
  onClientSelect: (clientId: string) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  selectedClientId,
  onClientSelect,
}) => {
  const { getAuthToken } = useAuthenticatedApi(); // Get the getAuthToken function
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  
  // Fetch clients using React Query
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['users'],
    queryFn: async () => {
      await getAuthToken(); // Ensure we have a valid token
      try {
        const { data } = await api.get('/users'); // Fetch users
        return data || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    enabled: isAuthenticated, // Only run if authenticated
  });

  const handleClientSelect = (value: string) => {
    onClientSelect(value);
  };

  if (isLoading) return <div>Loading clients...</div>;

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Client
      </label>
      <select
        value={selectedClientId || ''}
        onChange={(e) => handleClientSelect(e.target.value)}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        <option value="">Select a client</option>
        {clients?.map((client) => (
          <option key={client._id} value={client._id}>
            {client.name}
          </option>
        ))}
      </select>
    </div>
  );
};