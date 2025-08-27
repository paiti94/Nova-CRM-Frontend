import { useEffect } from 'react';

export default function OutlookPopupDone() {
useEffect(() => {
    // tell the opener to refresh user
    try {
      if (window.opener) {
        window.opener.postMessage({ type: 'MS_CONNECTED' }, window.origin);
      }
    } finally {
      window.close();
    }
  }, []);

  return <div>Connecting Outlook… you can close this window.</div>;
}
