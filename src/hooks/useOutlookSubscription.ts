import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../services/api';

type SubscriptionRow = {
  _id: string;
  userId: string;
  subscriptionId: string;
  clientState: string;
  expirationDateTime: string; // ISO
  resource: string;
};

export function useOutlookSubscription(enabled: boolean) {
  const qc = useQueryClient();
  const { getAuthToken } = useAuthenticatedApi();
  const subscribeCalled = useRef(false);

  // Read current status
  const status = useQuery({
    queryKey: ['ms-subscription-status'],
    enabled,
    queryFn: async () => {
      await getAuthToken();
      const { data } = await api.get('/microsoft/subscribe-status');
      return data as { subscription?: SubscriptionRow };
    },
    refetchOnWindowFocus: false,
    staleTime: 30_000, // 30s
  });

  // Create if missing/expired
  const subscribe = useMutation({
    mutationFn: async () => {
      await getAuthToken();
      const { data } = await api.post('/microsoft/subscribe-inbox');
      return data as { ok: boolean; reused?: boolean; subscriptionId?: string; expires?: string };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['ms-subscription-status'] });
    },
  });

  // Fire subscribe ONCE if there isn't a valid one
  useEffect(() => {
    if (!enabled || status.isLoading || subscribe.isPending) return;

    const sub = status.data?.subscription;
    const now = Date.now();
    const hasLive =
      sub?.expirationDateTime &&
      new Date(sub.expirationDateTime).getTime() - now > 2 * 60 * 1000; // > 2 min left

    if (!hasLive && !subscribeCalled.current) {
      subscribeCalled.current = true;
      subscribe.mutate();
    }
  }, [enabled, status.isLoading, status.data, subscribe.isPending, subscribe]);

  return {
    status,      // { data?.subscription, isLoading, error }
    subscribe,   // { mutate, isPending }
  };
}
