import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/utils/cn';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
  autoFocus?: boolean;
  minLength?: number;
}

/**
 * Optimized search input with debouncing
 * Reduces API calls by waiting for user to stop typing
 */
export function SearchInput({
  onSearch,
  placeholder = 'Поиск...',
  delay = 500,
  className,
  autoFocus = false,
  minLength = 0,
}: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, delay);

  useEffect(() => {
    if (debouncedQuery.length >= minLength) {
      setIsSearching(true);
      onSearch(debouncedQuery);
      setIsSearching(false);
    } else if (debouncedQuery.length === 0) {
      onSearch('');
    }
  }, [debouncedQuery, onSearch, minLength]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full px-4 py-2 pl-10 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
        
        {/* Search icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Clear button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Очистить поиск"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Loading indicator */}
        {isSearching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Search hint */}
      {query.length > 0 && query.length < minLength && (
        <p className="mt-1 text-xs text-slate-500">
          Введите минимум {minLength} символов для поиска
        </p>
      )}
    </div>
  );
}

/**
 * Compact search input for toolbars
 */
export function CompactSearchInput({
  onSearch,
  placeholder = 'Поиск...',
  delay = 500,
  className,
}: Omit<SearchInputProps, 'autoFocus' | 'minLength'>) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, delay);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 pl-8 pr-8 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent"
      />
      
      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {query && (
        <button
          onClick={() => {
            setQuery('');
            onSearch('');
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
