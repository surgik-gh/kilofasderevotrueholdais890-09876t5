import React, { memo, useMemo, useCallback } from 'react';
import { cn } from '@/utils/cn';

/**
 * Optimized list item component
 * Uses React.memo to prevent unnecessary re-renders
 */
interface ListItemProps {
  id: string;
  title: string;
  description?: string;
  onClick?: (id: string) => void;
  isSelected?: boolean;
  className?: string;
}

export const OptimizedListItem = memo(function OptimizedListItem({
  id,
  title,
  description,
  onClick,
  isSelected = false,
  className,
}: ListItemProps) {
  // Use useCallback to memoize the click handler
  const handleClick = useCallback(() => {
    onClick?.(id);
  }, [id, onClick]);

  return (
    <div
      onClick={handleClick}
      className={cn(
        'p-4 rounded-lg border transition-colors cursor-pointer',
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
        className
      )}
    >
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      )}
    </div>
  );
});

/**
 * Optimized list component with virtualization support
 */
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
  className?: string;
  itemClassName?: string;
}

export function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = 'Нет элементов',
  className,
  itemClassName,
}: OptimizedListProps<T>) {
  // Memoize the rendered items to prevent re-rendering unchanged items
  const renderedItems = useMemo(() => {
    return items.map((item, index) => {
      const key = keyExtractor(item, index);
      return (
        <div key={key} className={itemClassName}>
          {renderItem(item, index)}
        </div>
      );
    });
  }, [items, renderItem, keyExtractor, itemClassName]);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {renderedItems}
    </div>
  );
}

/**
 * Optimized grid component
 */
interface OptimizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 2 | 4 | 6 | 8;
  emptyMessage?: string;
  className?: string;
}

export function OptimizedGrid<T>({
  items,
  renderItem,
  keyExtractor,
  columns = 3,
  gap = 4,
  emptyMessage = 'Нет элементов',
  className,
}: OptimizedGridProps<T>) {
  const gridClasses = useMemo(() => {
    const colsClass = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
      6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
    }[columns];

    const gapClass = {
      2: 'gap-2',
      4: 'gap-4',
      6: 'gap-6',
      8: 'gap-8',
    }[gap];

    return `grid ${colsClass} ${gapClass}`;
  }, [columns, gap]);

  const renderedItems = useMemo(() => {
    return items.map((item, index) => {
      const key = keyExtractor(item, index);
      return (
        <div key={key}>
          {renderItem(item, index)}
        </div>
      );
    });
  }, [items, renderItem, keyExtractor]);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn(gridClasses, className)}>
      {renderedItems}
    </div>
  );
}

/**
 * Optimized card component
 */
interface CardProps {
  title: string;
  description?: string;
  image?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const OptimizedCard = memo(function OptimizedCard({
  title,
  description,
  image,
  footer,
  onClick,
  className,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border border-slate-200 overflow-hidden transition-shadow',
        onClick && 'cursor-pointer hover:shadow-lg',
        className
      )}
    >
      {image && (
        <div className="aspect-video bg-slate-100">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        )}
      </div>
      
      {footer && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
          {footer}
        </div>
      )}
    </div>
  );
});

/**
 * Example usage of optimized components
 */
export function OptimizedListExample() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const items = useMemo(() => [
    { id: '1', title: 'Item 1', description: 'Description 1' },
    { id: '2', title: 'Item 2', description: 'Description 2' },
    { id: '3', title: 'Item 3', description: 'Description 3' },
  ], []);

  const handleItemClick = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const renderItem = useCallback((item: typeof items[0]) => (
    <OptimizedListItem
      id={item.id}
      title={item.title}
      description={item.description}
      onClick={handleItemClick}
      isSelected={selectedId === item.id}
    />
  ), [handleItemClick, selectedId]);

  const keyExtractor = useCallback((item: typeof items[0]) => item.id, []);

  return (
    <OptimizedList
      items={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
    />
  );
}
