/**
 * Pagination utilities for optimizing large data lists
 */

export interface PaginationOptions {
  page: number;
  pageSize: number;
  total?: number;
}

export interface PaginationResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  pageSize: number,
  total: number
): Omit<PaginationResult<any>, 'data'> {
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Paginate array data (client-side pagination)
 */
export function paginateArray<T>(
  data: T[],
  page: number,
  pageSize: number
): PaginationResult<T> {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = data.slice(start, end);
  
  return {
    data: paginatedData,
    ...calculatePagination(page, pageSize, data.length),
  };
}

/**
 * Generate Supabase pagination query
 */
export function getSupabasePaginationRange(page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  
  return { start, end };
}

/**
 * Hook for managing pagination state
 */
export function usePagination(initialPageSize: number = 20) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const goToPage = (newPage: number) => {
    setPage(Math.max(1, newPage));
  };

  const nextPage = () => {
    setPage((prev) => prev + 1);
  };

  const prevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const reset = () => {
    setPage(1);
  };

  return {
    page,
    pageSize,
    setPageSize,
    goToPage,
    nextPage,
    prevPage,
    reset,
  };
}

// Add React import for the hook
import React from 'react';

/**
 * Pagination component
 */
interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  className?: string;
}

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
  hasNext,
  hasPrev,
  className = '',
}: PaginationControlsProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and pages around current
      pages.push(1);

      if (page > 3) {
        pages.push('...');
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrev}
        className="px-3 py-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
        aria-label="Previous page"
      >
        ←
      </button>

      {getPageNumbers().map((pageNum, index) => {
        if (pageNum === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
              ...
            </span>
          );
        }

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum as number)}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              pageNum === page
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-slate-300 hover:bg-slate-50'
            }`}
            aria-label={`Page ${pageNum}`}
            aria-current={pageNum === page ? 'page' : undefined}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        className="px-3 py-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
        aria-label="Next page"
      >
        →
      </button>
    </div>
  );
}

/**
 * Infinite scroll hook
 */
export function useInfiniteScroll(
  callback: () => void,
  options: {
    threshold?: number;
    enabled?: boolean;
  } = {}
) {
  const { threshold = 100, enabled = true } = options;

  React.useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollHeight - scrollTop - clientHeight < threshold) {
        callback();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, threshold, enabled]);
}

/**
 * Virtual list hook for very long lists
 */
export function useVirtualList<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  }
) {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;
  const totalHeight = items.length * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return {
    visibleItems,
    offsetY,
    totalHeight,
    handleScroll,
    startIndex,
    endIndex,
  };
}
