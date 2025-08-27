import axios, { AxiosError } from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';


// Create axios instance
 const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug function
const debugLog = (message: string, data?: any) => {
    if (import.meta.env.DEV) {
    //   console.log(`[API Debug] ${message}`, data || '');
    }
};
export function setApiAuthHeader(token: string | null) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}
// Custom hook to handle authentication
export const useAuthenticatedApi = () => {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();

  const getAuthToken = async () => {
    try {
    debugLog('Getting access token');
      const token = await getAccessTokenSilently();
      debugLog('Token received', token.substring(0, 20) + '...');
      localStorage.setItem('access_token', token);
      return token;
    } catch (error) {
        debugLog('Error getting token:', error);
      console.error('Error getting token:', error);
      throw error;
    }
  };

  // Add auth token interceptor
api.interceptors.request.use(
 async (config) => {
    try{
        // const token = localStorage.getItem('auth_token');
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          debugLog('Added token to request', config.url);
        }
        return config;
    } catch (error) {
        console.error('Error adding auth token to request:', error);
        debugLog('Error in request interceptor:', error);
        return Promise.reject(error);
    }
},
   (error) => {
        debugLog('Request interceptor error:', error);
        return Promise.reject(error);
      }
);
 // Add response interceptor for token expiration
//  api.interceptors.response.use(
//     (response) => response,
//     async (error: AxiosError) => {
//       if (error.response?.status === 401) {
//         debugLog('Unauthorized error - clearing token');
//         localStorage.removeItem('access_token');
//         await loginWithRedirect();
//       }
//       return Promise.reject(error);
//     }
//   );
// api.ts response interceptor
api.interceptors.response.use(
  r => r,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = (error.config?.url || '').toString();

    if (status === 401 && !url.includes('/microsoft/')) {
      localStorage.removeItem('access_token');
      // optional: show toast
      // and only then redirect
      // await loginWithRedirect();
    }
    return Promise.reject(error);
  }
);



  return {
    api,
    getAuthToken,
  };
};

export { api };
