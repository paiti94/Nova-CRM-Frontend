import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../services/api';
import { LatestEmail } from './LatestEmail';
import { EmailTaskCreator } from '../components/Tasks/EmailTaskCreator';
import OutlookTasks  from '../components/Tasks/OutlookTasks';
import { useOutlookSubscription } from '../hooks/useOutlookSubscription';

export function OutlookIntegrationPage() {
  const queryClient = useQueryClient();
  const { getAuthToken } = useAuthenticatedApi();

  const popupRef = useRef<Window | null>(null);
  const closePoll = useRef<number | null>(null);
  const connectPoll = useRef<number | null>(null);

  // Your user query MUST return { msConnected: boolean } (not tokens)
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => (await api.get('/users/me')).data,
  });

  const connected = !!user?.msConnected;
  const { status: subStatus, subscribe } = useOutlookSubscription(connected);
  const expiresNice = useMemo(() => {
    const iso = subStatus.data?.subscription?.expirationDateTime;
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }, [subStatus.data]);

  const stopClosePoll = () => {
    if (closePoll.current) {
      window.clearInterval(closePoll.current);
      closePoll.current = null;
    }
  };

  const stopConnectPoll = () => {
    if (connectPoll.current) {
      window.clearInterval(connectPoll.current);
      connectPoll.current = null;
    }
  };

  // Poll /users/me until msConnected === true (max 10s)
  const waitForConnection = useCallback(() => {
    let tries = 0;
    stopConnectPoll();
    connectPoll.current = window.setInterval(async () => {
      tries += 1;
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      const fresh = queryClient.getQueryData<any>(['user']);
      if (fresh?.msConnected) {
        stopConnectPoll();
      } else if (tries >= Math.ceil(10000 / 700)) {
        // give up after ~10 seconds
        stopConnectPoll();
      }
    }, 700) as unknown as number;
  }, [queryClient]);

  useEffect(() => {
    const SERVER_ORIGIN = new URL(import.meta.env.VITE_API_URL).origin; // e.g. http://localhost:5001

    const onMessage = (e: MessageEvent) => {
      // Accept message only from backend origin
      if (e.origin !== SERVER_ORIGIN) return;
      if (e.data && e.data.type === 'ms-connected') {
        stopClosePoll();
        // Kick off a connection poll in case DB write is slightly behind
        waitForConnection();
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      stopClosePoll();
      stopConnectPoll();
    };
  }, [waitForConnection]);

  const handleConnect = async () => {
    const token = await getAuthToken();
    const url = `${api.defaults.baseURL}/microsoft/login?auth_token=${encodeURIComponent(token)}`;

    popupRef.current = window.open(
      url,
      'ms-login',
      'width=600,height=800,menubar=no,toolbar=no,status=no,resizable=yes,scrollbars=yes'
    );

    // Fallback: if popup closes without posting a message
    if (popupRef.current) {
      stopClosePoll();
      closePoll.current = window.setInterval(() => {
        if (!popupRef.current || popupRef.current.closed) {
          stopClosePoll();
          waitForConnection();
        }
      }, 600) as unknown as number;
    }
  };

  const handleDisconnect = async () => {
    await api.post('/microsoft/disconnect');
    await queryClient.invalidateQueries({ queryKey: ['user'] });
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

      {connected && (
        <div className="mt-4 rounded border px-4 py-3 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Inbox Webhook Subscription</div>
              <div className="text-sm text-gray-600">
                {subStatus.isLoading
                  ? 'Checking status…'
                  : subStatus.data?.subscription
                  ? <>Active · Expires: <span className="font-medium">{expiresNice}</span></>
                  : 'No active subscription detected'}
              </div>
            </div>
                
            <button
              className="rounded bg-indigo-600 text-white px-3 py-2 disabled:opacity-60"
              onClick={() => subscribe.mutate()}
              disabled={subscribe.isPending}
            >
              {subscribe.isPending ? 'Ensuring…' : 'Ensure Active'}
            </button>
          </div>
        </div>
      )}

      {/* <div className="mt-8">
        <LatestEmail enabled={connected} />
      </div> */}
      <div className='mt-6'>
        <EmailTaskCreator></EmailTaskCreator>
      </div>
      {/* <div className='mt-10'>
        <OutlookTasks></OutlookTasks>
      </div> */}
    </div>
  );
}
