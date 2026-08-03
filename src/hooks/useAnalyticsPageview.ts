import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logEvent } from 'firebase/analytics';
import { getAnalyticsAsync } from '../lib/firebase';

export function useAnalyticsPageview(pageTitle?: string): void {
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    getAnalyticsAsync().then((analytics) => {
      if (cancelled || !analytics) return;
      logEvent(analytics, 'page_view', {
        page_title: pageTitle ?? document.title,
        page_location: window.location.href,
        page_path: location.pathname + location.search,
      });
    });
    window.scrollTo(0, 0);
    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, pageTitle]);
}
