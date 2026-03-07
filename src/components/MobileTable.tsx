import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => ReactNode;
}

interface MobileTableProps {
  columns: Column[];
  data: any[];
  className?: string;
  cardMode?: boolean; // Use card layout on mobile instead of scrollable table
}

/**
 * Mobile-optimized table component
 * Automatically switches between table and card layout based on screen size
 */
export function MobileTable({ columns, data, className, cardMode = true }: MobileTableProps) {
  return (
    <>
      {/* Desktop/Tablet: Scrollable table */}
      <div className={cn(
        "hidden sm:block overflow-x-auto -webkit-overflow-scrolling-touch",
        className
      )}>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50 transition-colors">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card layout */}
      {cardMode && (
        <div className="sm:hidden space-y-3">
          {data.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
            >
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-semibold text-slate-600 mr-4">
                    {column.label}
                  </span>
                  <span className="text-sm text-slate-900 text-right flex-1">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Mobile: Scrollable table (if cardMode is false) */}
      {!cardMode && (
        <div className="sm:hidden overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

interface MobileListProps {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  className?: string;
  emptyMessage?: string;
}

/**
 * Mobile-optimized list component with virtual scrolling support
 */
export function MobileList({ items, renderItem, className, emptyMessage = 'Нет элементов' }: MobileListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2 sm:space-y-3", className)}>
      {items.map((item, index) => (
        <div key={index} className="card-mobile-compact">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
