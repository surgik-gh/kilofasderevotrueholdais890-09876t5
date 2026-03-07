import { useEffect, useRef, useCallback } from 'react';

/**
 * Debounce hook for performance optimization
 * Delays execution of a function until after a specified delay
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * Throttle hook for performance optimization
 * Limits execution of a function to once per specified interval
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  const inThrottle = useRef(false);

  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;

        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    },
    [callback, limit]
  );
}

/**
 * Intersection Observer hook for lazy loading and visibility detection
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);

  return isIntersecting;
}

/**
 * Request Animation Frame hook for smooth animations
 */
export function useAnimationFrame(callback: (deltaTime: number) => void, deps: any[] = []) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  const animate = useCallback(
    (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    },
    [callback]
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate, ...deps]);
}

/**
 * Memoize expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Batch multiple state updates to reduce re-renders
 */
export function batchUpdates(callback: () => void) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(callback);
  } else {
    setTimeout(callback, 0);
  }
}

/**
 * Measure component render performance
 */
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
}

/**
 * Detect slow renders and log warnings
 */
export function usePerformanceMonitor(componentName: string, threshold: number = 16) {
  const startTimeRef = useRef<number>();

  useEffect(() => {
    startTimeRef.current = performance.now();

    return () => {
      if (startTimeRef.current) {
        const renderTime = performance.now() - startTimeRef.current;
        
        if (renderTime > threshold && process.env.NODE_ENV === 'development') {
          console.warn(
            `⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`
          );
        }
      }
    };
  });
}

/**
 * Optimize list rendering with virtual scrolling
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

  const visibleItems = items.slice(
    Math.max(0, visibleStart - 5), // Buffer above
    Math.min(items.length, visibleEnd + 5) // Buffer below
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = Math.max(0, visibleStart - 5) * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

/**
 * Preload critical resources
 */
export function preloadResources(resources: { type: 'image' | 'script' | 'style'; url: string }[]) {
  resources.forEach(({ type, url }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    if (type === 'image') {
      link.as = 'image';
    } else if (type === 'script') {
      link.as = 'script';
    } else if (type === 'style') {
      link.as = 'style';
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Check if device is low-end and should use reduced animations
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return true;

  // Check device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 4) return true;

  // Check hardware concurrency (CPU cores)
  const hardwareConcurrency = navigator.hardwareConcurrency;
  if (hardwareConcurrency && hardwareConcurrency < 4) return true;

  return false;
}

/**
 * Optimize images for current device
 */
export function getOptimizedImageUrl(baseUrl: string, width?: number): string {
  if (!width) {
    width = window.innerWidth;
  }

  // Round up to nearest standard size
  const sizes = [320, 640, 768, 1024, 1280, 1536, 1920];
  const optimalSize = sizes.find(size => size >= width) || sizes[sizes.length - 1];

  return `${baseUrl}?w=${optimalSize}&q=80&fm=webp`;
}

/**
 * React import for hooks
 */
import React from 'react';
