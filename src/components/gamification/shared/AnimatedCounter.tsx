import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

/**
 * AnimatedCounter Component
 * 
 * Displays an animated number counter with smooth transitions
 * 
 * Requirements:
 * - 10.1-10.7: Animated counters for rewards and progress
 */
export function AnimatedCounter({
  value,
  duration = 1000,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Use spring animation for smooth counting
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration,
  });

  const display = useTransform(spring, (latest) => {
    return prefix + latest.toFixed(decimals) + suffix;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(latest);
    });

    return () => unsubscribe();
  }, [spring]);

  return (
    <motion.span
      className={className}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </motion.span>
  );
}

/**
 * SimpleAnimatedCounter Component
 * 
 * A simpler version using just CSS animations
 */
interface SimpleAnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function SimpleAnimatedCounter({
  from,
  to,
  duration = 1000,
  className = '',
  prefix = '',
  suffix = '',
}: SimpleAnimatedCounterProps) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    const startTime = Date.now();
    const difference = to - from;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = from + difference * easeOut;

      setCount(Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [from, to, duration]);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      {count}
      {suffix}
    </motion.span>
  );
}

/**
 * PulsingCounter Component
 * 
 * Counter with pulsing animation on value change
 */
interface PulsingCounterProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  pulseColor?: string;
}

export function PulsingCounter({
  value,
  className = '',
  prefix = '',
  suffix = '',
  pulseColor = 'rgba(59, 130, 246, 0.5)',
}: PulsingCounterProps) {
  const [prevValue, setPrevValue] = useState(value);
  const [shouldPulse, setShouldPulse] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setShouldPulse(true);
      setPrevValue(value);

      const timer = setTimeout(() => {
        setShouldPulse(false);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <motion.span
      className={className}
      animate={
        shouldPulse
          ? {
              scale: [1, 1.3, 1],
              textShadow: [
                '0 0 0px rgba(0,0,0,0)',
                `0 0 20px ${pulseColor}`,
                '0 0 0px rgba(0,0,0,0)',
              ],
            }
          : {}
      }
      transition={{ duration: 0.6 }}
    >
      {prefix}
      {value}
      {suffix}
    </motion.span>
  );
}
