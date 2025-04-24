import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { User } from 'lucide-react';

interface Client {
  _id: string;
  name: string;
  email: string;
  company?: string;
}

interface ClientSelectorProps {
  selectedClient: string | null;
  onSelectClient: (clientId: string | null) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  selectedClient,
  onSelectClient,
}) => {
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/users/clients');
      return data;
    },
  });

  if (isLoading) return <div>Loading clients...</div>;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select Client
      </label>
      <div className="relative">
        <select
          value={selectedClient || ''}
          onChange={(e) => onSelectClient(e.target.value || null)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="">All Files</option>
          {clients?.map((client) => (
            <option key={client._id} value={client._id}>
              {client.name} {client.company ? `(${client.company})` : ''}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}; 