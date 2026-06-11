import { useEffect, useRef } from 'react';
import { monitor } from '@/lib/monitor';

export function usePerformanceMonitor(componentName: string) {
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    mountTimeRef.current = performance.now();
    monitor.addBreadcrumb('lifecycle', `${componentName} mounted`);

    return () => {
      const duration = performance.now() - mountTimeRef.current;
      monitor.addBreadcrumb('lifecycle', `${componentName} unmounted`, {
        lifespan: duration.toFixed(2) + 'ms',
      });
    };
  }, [componentName]);
}

export function useRenderTimer(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef<number>(0);

  const now = performance.now();
  renderCountRef.current += 1;

  if (lastRenderTimeRef.current) {
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    if (timeSinceLastRender < 16) {
      monitor.addBreadcrumb('performance', `${componentName} frequent render`, {
        interval: timeSinceLastRender.toFixed(2) + 'ms',
        renderCount: renderCountRef.current,
      });
    }
  }

  lastRenderTimeRef.current = now;

  return renderCountRef.current;
}

export function useTrackEvent() {
  const track = (eventName: string, properties?: Record<string, unknown>) => {
    monitor.trackEvent(eventName, properties);
  };

  return track;
}

export default usePerformanceMonitor;
