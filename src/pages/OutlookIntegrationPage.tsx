// OutlookIntegrationPage.tsx
import { useQuery } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../services/api';
import { LatestEmail } from './LatestEmail';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function OutlookIntegrationPage() {
  const { getAuthToken } = useAuthenticatedApi(); // <-- move inside component (fix)
  const { data: user, refetch } = useQuery({ queryKey: ['user'], queryFn: async () => (await api.get('/users/me')).data });

  const location = useLocation();
  const navigate = useNavigate();
  const connected = !!user?.msConnected; // <-- use boolean, not tokens

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('connected') === '1') {
      refetch();
      p.delete('connected');
      navigate({ pathname: '/outlook', search: p.toString() }, { replace: true });
    }
  }, [location.search, refetch, navigate]);

  const handleConnect = async () => {
    const token = await getAuthToken(); // Auth0 access token for your API
    window.open(
      `${api.defaults.baseURL}/microsoft/login?auth_token=${encodeURIComponent(token)}`,
      "_blank",
      "width=600,height=800"
    );
  };

  const handleDisconnect = async () => {
    await api.post('/microsoft/disconnect');
    refetch();
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Outlook Integration</h2>

      {connected ? (
        <>
          <div className="text-green-600 mb-4">✅ Outlook is connected.</div>
          <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleDisconnect}>
            Disconnect Outlook
          </button>
        </>
      ) : (
        <>
          <div className="text-yellow-600 mb-2">Outlook is not connected.</div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleConnect}>
            Connect Outlook
          </button>
        </>
      )}

      <LatestEmail enabled={connected} />
    </div>
  );
}
