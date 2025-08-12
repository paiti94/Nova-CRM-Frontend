// src/providers/ApiAuthProvider.tsx
import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { setApiAuthHeader } from '../services/api';

export default function ApiAuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    let cancel = false;
    const apply = async () => {
      try {
        if (!isAuthenticated) { setApiAuthHeader(null); return; }
        const token = await getAccessTokenSilently().catch(err => {
          // IMPORTANT: swallow login_required / consent_required so we don’t redirect
          console.warn('getAccessTokenSilently failed', err?.error || err?.message);
          return null;
        });
        if (!cancel) setApiAuthHeader(token ?? null);
      } catch { setApiAuthHeader(null); }
    };
    apply();
    const id = setInterval(apply, 8 * 60 * 1000);
    return () => { cancel = true; clearInterval(id); };
  }, [isAuthenticated, getAccessTokenSilently]);

  return <>{children}</>;
}
