import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface ResponsiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  mobileSrc?: string; // Optional mobile-optimized version
  tabletSrc?: string; // Optional tablet-optimized version
  webpSrc?: string; // Optional WebP version for better compression
  lazy?: boolean; // Enable lazy loading (default: true)
  blur?: boolean; // Show blur placeholder while loading (default: true)
  aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * Responsive image component with lazy loading and mobile optimization
 * Automatically loads appropriate image size based on screen width
 * Supports WebP format for better compression
 */
export function ResponsiveImage({
  src,
  alt,
  mobileSrc,
  tabletSrc,
  webpSrc,
  lazy = true,
  blur = true,
  aspectRatio,
  objectFit = 'cover',
  className,
  ...props
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [supportsWebP, setSupportsWebP] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check WebP support
  useEffect(() => {
    const checkWebPSupport = async () => {
      if (!webpSrc) return;
      
      const webpData = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
      const img = new Image();
      img.onload = () => setSupportsWebP(img.width === 1);
      img.onerror = () => setSupportsWebP(false);
      img.src = webpData;
    };
    
    checkWebPSupport();
  }, [webpSrc]);

  // Determine which image source to use based on screen size
  useEffect(() => {
    const updateImageSrc = () => {
      const width = window.innerWidth;
      
      // Use WebP if supported and available
      if (supportsWebP && webpSrc) {
        setCurrentSrc(webpSrc);
        return;
      }
      
      if (width < 640 && mobileSrc) {
        setCurrentSrc(mobileSrc);
      } else if (width < 1024 && tabletSrc) {
        setCurrentSrc(tabletSrc);
      } else {
        setCurrentSrc(src);
      }
    };

    updateImageSrc();
    window.addEventListener('resize', updateImageSrc);
    
    return () => window.removeEventListener('resize', updateImageSrc);
  }, [src, mobileSrc, tabletSrc, webpSrc, supportsWebP]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const containerStyle = aspectRatio
    ? { aspectRatio }
    : undefined;

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-slate-100',
        className
      )}
      style={containerStyle}
    >
      {/* Blur placeholder */}
      {blur && !isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          loading={lazy ? 'lazy' : 'eager'}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
            objectFit === 'scale-down' && 'object-scale-down'
          )}
          {...props}
        />
      )}
    </div>
  );
}

interface AvatarImageProps {
  src?: string;
  alt: string;
  fallback?: string; // Fallback text (e.g., initials)
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Optimized avatar image component
 */
export function AvatarImage({ src, alt, fallback, size = 'md', className }: AvatarImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-bold',
        sizeClasses[size],
        className
      )}
    >
      {src && !hasError ? (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse" />
          )}
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        </>
      ) : (
        <span>{fallback || alt.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

/**
 * Utility function to generate srcset for responsive images
 */
export function generateSrcSet(baseUrl: string, sizes: number[]): string {
  return sizes
    .map((size) => `${baseUrl}?w=${size} ${size}w`)
    .join(', ');
}

/**
 * Utility function to preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}
