/**
 * Table Component - A flexible, accessible data table with sorting and styling options
 * Part of @0x1js/components
 */

import { JSX, useState } from '0x1';

export interface TableColumn {
  /** Unique key for the column */
  key: string;
  /** Display label for the column header */
  label: string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Custom render function for cell content */
  render?: (value: any, row: any, index: number) => JSX.Element | string;
  /** Column width (CSS value) */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

export interface TableProps {
  /** Array of data rows */
  data: Record<string, any>[];
  /** Column configuration */
  columns: TableColumn[];
  /** Table variant */
  variant?: 'default' | 'striped' | 'bordered' | 'minimal';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether rows are hoverable */
  hoverable?: boolean;
  /** Whether the table is loading */
  loading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Message when no data */
  emptyMessage?: string;
  /** Row click handler */
  onRowClick?: (row: any, index: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: Record<string, string | number>;
  /** Test ID for testing */
  'data-testid'?: string;
}

export function Table({
  data,
  columns,
  variant = 'default',
  size = 'md',
  hoverable = false,
  loading = false,
  loadingMessage = 'Loading...',
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
  style = {},
  'data-testid': testId,
  ...props
}: TableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (columnKey: string) => {
    if (!columns.find(col => col.key === columnKey)?.sortable) return;

    setSortConfig(current => ({
      key: columnKey,
      direction: current?.key === columnKey && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = sortConfig ? [...data].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  }) : data;

  const baseClasses = [
    'table',
    `table--${variant}`,
    `table--${size}`,
    hoverable && 'table--hoverable',
    className
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className="table-container" style={getContainerStyles()}>
        <div className="table-loading" style={getLoadingStyles()}>
          {loadingMessage}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="table-container" style={getContainerStyles()}>
        <div className="table-empty" style={getEmptyStyles()}>
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="table-container" style={getContainerStyles()}>
      <table 
        className={baseClasses}
        style={{
          ...getTableStyles(variant, size),
          ...style
        }}
        data-testid={testId}
        {...props}
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  ...getHeaderStyles(column, variant),
                  width: column.width,
                  textAlign: column.align || 'left'
                }}
                onClick={() => handleSort(column.key)}
                className={column.sortable ? 'table-header--sortable' : ''}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {column.label}
                  {column.sortable && (
                    <span style={getSortIconStyles(column.key, sortConfig)}>
                      {sortConfig?.key === column.key 
                        ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                        : '↕'
                      }
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={index}
              style={getRowStyles(variant, onRowClick)}
              onClick={() => onRowClick?.(row, index)}
              className={onRowClick ? 'table-row--clickable' : ''}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    ...getCellStyles(variant, size),
                    textAlign: column.align || 'left'
                  }}
                >
                  {column.render 
                    ? column.render(row[column.key], row, index)
                    : row[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getContainerStyles(): Record<string, string | number> {
  return {
    width: '100%',
    overflowX: 'auto'
  };
}

function getTableStyles(variant: string, size: string): Record<string, string | number> {
  return {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem'
  };
}

function getHeaderStyles(column: TableColumn, variant: string): Record<string, string | number> {
  return {
    padding: '0.75rem 1rem',
    fontWeight: '600',
    backgroundColor: variant === 'minimal' ? 'transparent' : '#f8fafc',
    borderBottom: variant === 'bordered' ? '2px solid #e2e8f0' : '1px solid #e2e8f0',
    cursor: column.sortable ? 'pointer' : 'default',
    userSelect: 'none'
  };
}

function getRowStyles(variant: string, clickable?: Function): Record<string, string | number> {
  const styles: Record<string, string | number> = {};

  if (variant === 'striped') {
    styles.backgroundColor = 'rgba(248, 250, 252, 0.5)';
  }

  if (clickable) {
    styles.cursor = 'pointer';
  }

  return styles;
}

function getCellStyles(variant: string, size: string): Record<string, string | number> {
  const padding = size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '1rem' : '0.75rem 1rem';

  return {
    padding,
    borderBottom: variant === 'minimal' ? 'none' : '1px solid #e2e8f0',
    ...(variant === 'bordered' && {
      border: '1px solid #e2e8f0'
    })
  };
}

function getSortIconStyles(columnKey: string, sortConfig: any): Record<string, string | number> {
  return {
    fontSize: '0.75rem',
    opacity: sortConfig?.key === columnKey ? 1 : 0.5,
    transition: 'opacity 0.2s'
  };
}

function getLoadingStyles(): Record<string, string | number> {
  return {
    padding: '2rem',
    textAlign: 'center',
    color: '#64748b'
  };
}

function getEmptyStyles(): Record<string, string | number> {
  return {
    padding: '2rem',
    textAlign: 'center',
    color: '#64748b'
  };
}

// Export for convenience
export default Table;
