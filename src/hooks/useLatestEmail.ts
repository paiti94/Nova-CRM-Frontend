import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useLatestEmail(enabled: boolean) {

    // return useQuery({
    //     queryKey: ['latest-email'],
    //     queryFn: async () => {
    //       // IMPORTANT: use the same axios instance baseURL; avoid re-prepending VITE_API_URL
    //       const res = await api.get('/microsoft/latest-email');
    //       return res.data;
    //     },
    //     enabled, // <-- only run when connected
    //     retry: false,
    //   });
    return useQuery({
      queryKey: ['latest-email'],
      queryFn: async () => (await api.get('/microsoft/latest-email')).data,
      enabled,           // <-- important
      staleTime: 30_000,
      retry: 1
    });
}