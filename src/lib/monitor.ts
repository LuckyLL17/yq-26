interface MonitorConfig {
  enabled: boolean;
  appName: string;
  sampleRate: number;
  maxBreadcrumbs: number;
  endpoint?: string;
}

interface MonitorErrorOptions {
  component?: string;
  componentStack?: string | null;
  type?: string;
  extra?: Record<string, unknown>;
}

interface PerformanceMetrics {
  fp?: number;
  fcp?: number;
  lcp?: number;
  cls?: number;
  ttfb?: number;
  fid?: number;
}

interface Breadcrumb {
  timestamp: number;
  type: string;
  message: string;
  data?: Record<string, unknown>;
}

class Monitor {
  private config: MonitorConfig;
  private breadcrumbs: Breadcrumb[] = [];
  private performanceMetrics: PerformanceMetrics = {};
  private errors: Array<{
    timestamp: number;
    error: Error;
    options: MonitorErrorOptions;
  }> = [];

  constructor() {
    this.config = {
      enabled: true,
      appName: 'yq-26-card-tower-defense',
      sampleRate: 1.0,
      maxBreadcrumbs: 50,
    };
  }

  init(config: Partial<MonitorConfig> = {}) {
    this.config = { ...this.config, ...config };
    
    if (this.config.enabled) {
      this.setupGlobalErrorHandlers();
      this.setupPerformanceMonitoring();
      this.setupUnhandledRejection();
    }
  }

  private setupGlobalErrorHandlers() {
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (error) {
        let messageStr = '';
        if (typeof message === 'string') {
          messageStr = message;
        } else if (message instanceof ErrorEvent) {
          messageStr = message.message;
        }
        
        this.captureError(error, {
          type: 'global-error',
          extra: {
            message: messageStr,
            source,
            lineno,
            colno,
          },
        });
      }
      
      if (originalOnError) {
        return originalOnError.call(window, message, source, lineno, colno, error);
      }
      return false;
    };
  }

  private setupUnhandledRejection() {
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const error = reason instanceof Error 
        ? reason 
        : new Error(typeof reason === 'string' ? reason : JSON.stringify(reason));
      
      this.captureError(error, {
        type: 'unhandled-promise-rejection',
        extra: { reason: String(reason) },
      });
    });
  }

  private setupPerformanceMonitoring() {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.performanceMetrics.fcp = entry.startTime;
            this.addBreadcrumb('performance', `FCP: ${entry.startTime.toFixed(2)}ms`);
          }
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch {
      // silently ignore
    }

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.performanceMetrics.lcp = lastEntry.startTime;
          this.addBreadcrumb('performance', `LCP: ${lastEntry.startTime.toFixed(2)}ms`);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // silently ignore
    }

    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as PerformanceEntry & { hadRecentInput: boolean }).hadRecentInput) {
            clsValue += (entry as PerformanceEntry & { value: number }).value;
          }
        }
        this.performanceMetrics.cls = clsValue;
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // silently ignore
    }

    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming;
          this.performanceMetrics.ttfb = navEntry.responseStart - navEntry.requestStart;
          this.addBreadcrumb('performance', `TTFB: ${this.performanceMetrics.ttfb.toFixed(2)}ms`);
        }
      });
      navObserver.observe({ type: 'navigation', buffered: true });
    } catch {
      // silently ignore
    }
  }

  captureError(error: Error, options: MonitorErrorOptions = {}) {
    if (!this.config.enabled) return;
    if (Math.random() > this.config.sampleRate) return;

    const errorRecord = {
      timestamp: Date.now(),
      error,
      options,
    };

    this.errors.push(errorRecord);
    this.addBreadcrumb('error', error.message, { 
      type: options.type,
      component: options.component,
    });

    console.error('[Monitor] Error captured:', {
      message: error.message,
      stack: error.stack,
      ...options,
    });

    if (this.config.endpoint) {
      this.sendToEndpoint('/errors', {
        timestamp: errorRecord.timestamp,
        message: error.message,
        stack: error.stack,
        ...options,
        breadcrumbs: this.breadcrumbs.slice(-20),
      });
    }
  }

  addBreadcrumb(type: string, message: string, data?: Record<string, unknown>) {
    if (!this.config.enabled) return;

    const breadcrumb: Breadcrumb = {
      timestamp: Date.now(),
      type,
      message,
      data,
    };

    this.breadcrumbs.push(breadcrumb);
    
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  trackEvent(name: string, properties?: Record<string, unknown>) {
    if (!this.config.enabled) return;

    this.addBreadcrumb('event', name, properties);
    
    if (this.config.endpoint) {
      this.sendToEndpoint('/events', {
        timestamp: Date.now(),
        name,
        properties,
      });
    }
  }

  trackPerformance(metricName: string, value: number, extra?: Record<string, unknown>) {
    if (!this.config.enabled) return;

    this.addBreadcrumb('performance', `${metricName}: ${value}ms`, { value, ...extra });
    
    if (this.config.endpoint) {
      this.sendToEndpoint('/performance', {
        timestamp: Date.now(),
        metric: metricName,
        value,
        extra,
      });
    }
  }

  startTimer(name: string): () => number {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.trackPerformance(name, duration);
      return duration;
    };
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  getErrors() {
    return [...this.errors];
  }

  getConfig(): MonitorConfig {
    return { ...this.config };
  }

  private sendToEndpoint(path: string, data: unknown) {
    if (!this.config.endpoint) return;

    const url = this.config.endpoint + path;
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, JSON.stringify(data));
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {
        // ignore send failures
      });
    }
  }

  reportAll() {
    const report = {
      app: this.config.appName,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      errors: this.errors.length,
      performance: this.performanceMetrics,
      breadcrumbs: this.breadcrumbs,
    };

    console.log('[Monitor] Report:', report);
    return report;
  }
}

export const monitor = new Monitor();
export default monitor;
