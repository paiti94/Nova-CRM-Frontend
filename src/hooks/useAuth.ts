import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  // ... other user properties
}

export const useAuth = () => {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    user,
    isLoading,
    error,
    isAdmin: user?.role === 'admin',
  };
}; 