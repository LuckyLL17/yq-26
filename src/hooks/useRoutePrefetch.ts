import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { monitor } from '@/lib/monitor';

export function useRoutePrefetch() {
  const location = useLocation();

  useEffect(() => {
    monitor.trackEvent('route_change', { path: location.pathname });
    monitor.addBreadcrumb('navigation', `Navigated to ${location.pathname}`);
  }, [location.pathname]);

  const prefetchEditor = () => {
    const editorChunk = document.querySelector('script[src*="Editor"]');
    if (!editorChunk) {
      import('@/pages/Editor').then(() => {
        monitor.addBreadcrumb('performance', 'Editor page prefetched');
      });
    }
  };

  return { prefetchEditor };
}

export default useRoutePrefetch;
