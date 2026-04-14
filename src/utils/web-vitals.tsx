/**
 * Web Vitals monitoring for performance tracking
 * Tracks Core Web Vitals: LCP, FID, CLS, FCP, TTFB
 */

import React from 'react';

export interface WebVitalsMetric {
  name: 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  inp?: number; // Interaction to Next Paint

  // Custom metrics
  pageLoadTime?: number;
  domContentLoaded?: number;
  resourceLoadTime?: number;
  
  // Navigation timing
  navigationStart?: number;
  responseEnd?: number;
  domInteractive?: number;
  domComplete?: number;
  loadEventEnd?: number;
}

/**
 * Web Vitals thresholds
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

/**
 * Get rating for a metric
 */
function getRating(
  name: keyof typeof THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Web Vitals reporter
 */
class WebVitalsReporter {
  private metrics: Map<string, WebVitalsMetric> = new Map();
  private listeners: Array<(metric: WebVitalsMetric) => void> = [];

  /**
   * Initialize Web Vitals monitoring
   */
  async init() {
    if (typeof window === 'undefined') return;

    try {
      // Dynamically import web-vitals library
      const webVitals = await import('web-vitals');
      const { onCLS, onFCP, onLCP, onTTFB, onINP } = webVitals;

      // Track all Core Web Vitals (FID deprecated, using INP instead)
      onCLS(this.handleMetric.bind(this));
      onFCP(this.handleMetric.bind(this));
      onLCP(this.handleMetric.bind(this));
      onTTFB(this.handleMetric.bind(this));
      onINP(this.handleMetric.bind(this));
    } catch (error) {
      console.warn('Web Vitals library not available:', error);
      // Fallback to manual tracking
      this.initManualTracking();
    }
  }

  /**
   * Handle metric update
   */
  private handleMetric(metric: any) {
    const webVitalsMetric: WebVitalsMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    };

    this.metrics.set(metric.name, webVitalsMetric);
    this.notifyListeners(webVitalsMetric);

    // Log poor metrics
    if (metric.rating === 'poor') {
      console.warn(`Poor ${metric.name}:`, metric.value);
    }
  }

  /**
   * Manual tracking fallback
   */
  private initManualTracking() {
    if (!window.performance) return;

    // Track page load time
    window.addEventListener('load', () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

      console.log('Page Load Time:', pageLoadTime, 'ms');
    });

    // Track FCP manually
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          console.log('FCP:', entry.startTime, 'ms');
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(listener: (metric: WebVitalsMetric) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(metric: WebVitalsMetric) {
    this.listeners.forEach((listener) => {
      try {
        listener(metric);
      } catch (error) {
        console.error('Error in Web Vitals listener:', error);
      }
    });
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): Map<string, WebVitalsMetric> {
    return new Map(this.metrics);
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    const summary: Record<string, any> = {};
    
    this.metrics.forEach((metric, name) => {
      summary[name] = {
        value: metric.value,
        rating: metric.rating,
      };
    });

    return summary;
  }

  /**
   * Send metrics to analytics
   */
  sendToAnalytics(metric: WebVitalsMetric) {
    // Send to your analytics service
    // Example: Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Example: Custom analytics endpoint
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      }).catch((error) => {
        console.error('Failed to send Web Vitals:', error);
      });
    }
  }
}

// Singleton instance
export const webVitalsReporter = new WebVitalsReporter();

/**
 * Get performance metrics from Navigation Timing API
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  if (typeof window === 'undefined' || !window.performance) {
    return {};
  }

  const perfData = window.performance.timing;
  const navigation = window.performance.navigation;

  return {
    pageLoadTime: perfData.loadEventEnd - perfData.navigationStart,
    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
    resourceLoadTime: perfData.loadEventEnd - perfData.responseEnd,
    navigationStart: perfData.navigationStart,
    responseEnd: perfData.responseEnd,
    domInteractive: perfData.domInteractive,
    domComplete: perfData.domComplete,
    loadEventEnd: perfData.loadEventEnd,
  };
}

/**
 * Get resource timing information
 */
export function getResourceTiming() {
  if (typeof window === 'undefined' || !window.performance) {
    return [];
  }

  const resources = window.performance.getEntriesByType('resource');
  
  return resources.map((resource: any) => ({
    name: resource.name,
    type: resource.initiatorType,
    duration: resource.duration,
    size: resource.transferSize,
    startTime: resource.startTime,
  }));
}

/**
 * Performance budget checker
 */
export class PerformanceBudget {
  private budgets = {
    LCP: 2500,
    FID: 100,
    CLS: 0.1,
    FCP: 1800,
    TTFB: 800,
    pageLoadTime: 3000,
    bundleSize: 500 * 1024, // 500KB
  };

  setBudget(metric: string, value: number) {
    this.budgets[metric as keyof typeof this.budgets] = value;
  }

  check(metrics: PerformanceMetrics): {
    passed: boolean;
    violations: Array<{ metric: string; value: number; budget: number }>;
  } {
    const violations: Array<{ metric: string; value: number; budget: number }> = [];

    Object.entries(metrics).forEach(([metric, value]) => {
      const budget = this.budgets[metric as keyof typeof this.budgets];
      if (budget && value !== undefined && value > budget) {
        violations.push({ metric, value, budget });
      }
    });

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  report() {
    const metrics = getPerformanceMetrics();
    const result = this.check(metrics);

    if (!result.passed) {
      console.warn('Performance budget violations:', result.violations);
    }

    return result;
  }
}

export const performanceBudget = new PerformanceBudget();

/**
 * React hook for Web Vitals monitoring
 */
export function useWebVitals(
  onMetric?: (metric: WebVitalsMetric) => void
) {
  const [metrics, setMetrics] = React.useState<Map<string, WebVitalsMetric>>(
    new Map()
  );

  React.useEffect(() => {
    webVitalsReporter.init();

    const unsubscribe = webVitalsReporter.subscribe((metric) => {
      setMetrics((prev) => new Map(prev).set(metric.name, metric));
      onMetric?.(metric);
    });

    return unsubscribe;
  }, [onMetric]);

  return metrics;
}

/**
 * Performance monitoring component
 */
export function PerformanceMonitor() {
  const metrics = useWebVitals((metric) => {
    // Send to analytics
    webVitalsReporter.sendToAnalytics(metric);
  });

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-slate-300 rounded-lg shadow-lg p-4 text-xs max-w-xs">
      <h3 className="font-bold mb-2">Web Vitals</h3>
      <div className="space-y-1">
        {Array.from(metrics.entries()).map(([name, metric]) => (
          <div key={name} className="flex justify-between">
            <span>{name}:</span>
            <span
              className={
                metric.rating === 'good'
                  ? 'text-green-600'
                  : metric.rating === 'needs-improvement'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }
            >
              {metric.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}