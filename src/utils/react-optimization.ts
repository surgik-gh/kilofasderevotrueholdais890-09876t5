/**
 * React optimization utilities
 * Helpers for improving React component performance
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';

/**
 * Check if two objects are shallowly equal
 */
export function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (
    typeof obj1 !== 'object' ||
    obj1 === null ||
    typeof obj2 !== 'object' ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
}

/**
 * Custom hook to prevent unnecessary re-renders
 * Returns true only when dependencies actually change
 */
export function useDeepCompareMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  const ref = useRef<React.DependencyList>(deps);
  
  if (!shallowEqual(ref.current, deps)) {
    ref.current = deps;
  }
  
  return useMemo(factory, ref.current);
}

/**
 * Stable callback that doesn't change on re-renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Hook to track component render count (development only)
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
 * Hook to detect why component re-rendered (development only)
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>();
  
  useEffect(() => {
    if (previousProps.current && process.env.NODE_ENV === 'development') {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};
      
      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });
      
      if (Object.keys(changedProps).length > 0) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }
    
    previousProps.current = props;
  });
}

/**
 * Hook for expensive computations with memoization
 */
export function useExpensiveMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options: { debug?: boolean; name?: string } = {}
): T {
  const { debug = false, name = 'anonymous' } = options;
  
  return useMemo(() => {
    if (debug && process.env.NODE_ENV === 'development') {
      const start = performance.now();
      const result = factory();
      const duration = performance.now() - start;
      console.log(`[useMemo] ${name} took ${duration.toFixed(2)}ms`);
      return result;
    }
    return factory();
  }, deps);
}

/**
 * Hook to prevent component from re-rendering too frequently
 */
export function useThrottledState<T>(
  initialValue: T,
  delay: number = 500
): [T, (value: T) => void] {
  const [state, setState] = React.useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastExecuted = useRef<number>(0);
  
  const setThrottledState = useCallback(
    (value: T) => {
      const now = Date.now();
      const timeSinceLastExecution = now - lastExecuted.current;
      
      if (timeSinceLastExecution >= delay) {
        lastExecuted.current = now;
        setState(value);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastExecuted.current = Date.now();
          setState(value);
        }, delay - timeSinceLastExecution);
      }
    },
    [delay]
  );
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return [state, setThrottledState];
}

/**
 * Performance monitoring for components
 */
export class ComponentPerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  
  startMeasure(componentName: string) {
    performance.mark(`${componentName}-start`);
  }
  
  endMeasure(componentName: string) {
    const startMark = `${componentName}-start`;
    const endMark = `${componentName}-end`;
    const measureName = `${componentName}-render`;
    
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    const measure = performance.getEntriesByName(measureName)[0];
    const duration = measure.duration;
    
    const measurements = this.measurements.get(componentName) || [];
    measurements.push(duration);
    this.measurements.set(componentName, measurements);
    
    // Clean up marks
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
    
    return duration;
  }
  
  getStats(componentName: string) {
    const measurements = this.measurements.get(componentName) || [];
    
    if (measurements.length === 0) {
      return null;
    }
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    const avg = sum / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    
    return {
      count: measurements.length,
      avg,
      min,
      max,
      total: sum,
    };
  }
  
  getAllStats() {
    const stats: Record<string, any> = {};
    
    this.measurements.forEach((_, componentName) => {
      stats[componentName] = this.getStats(componentName);
    });
    
    return stats;
  }
  
  reset() {
    this.measurements.clear();
  }
}

export const performanceMonitor = new ComponentPerformanceMonitor();

/**
 * HOC to add performance monitoring to components
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const name = componentName || Component.displayName || Component.name || 'Anonymous';
  
  return function PerformanceMonitoredComponent(props: P) {
    useEffect(() => {
      performanceMonitor.startMeasure(name);
      return () => {
        const duration = performanceMonitor.endMeasure(name);
        if (duration > 16.67) { // More than one frame (60fps)
          console.warn(`${name} render took ${duration.toFixed(2)}ms (> 16.67ms)`);
        }
      };
    });
    
    return <Component {...props} />;
  };
}

/**
 * Optimization guidelines for components
 */
export const optimizationGuidelines = `
React Performance Optimization Guidelines:

1. Use React.memo for expensive components that receive the same props
2. Use useMemo for expensive computations
3. Use useCallback for functions passed as props to memoized components
4. Avoid inline object/array creation in render
5. Use key prop correctly in lists
6. Lazy load heavy components with React.lazy
7. Use virtualization for long lists
8. Avoid unnecessary state updates
9. Use proper dependency arrays in useEffect
10. Profile with React DevTools Profiler

Common Anti-patterns to Avoid:
- Creating new objects/arrays in render: { style: { color: 'red' } }
- Inline arrow functions in JSX: onClick={() => handleClick()}
- Not memoizing context values
- Updating state on every render
- Large component trees without code splitting
`;

// Add React import
import React from 'react';
