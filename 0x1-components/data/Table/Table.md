# Table Component

A flexible, accessible data table with sorting capabilities and multiple styling options.

## Usage

```tsx
import { Table } from '@0x1js/components';

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
];

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
];

function App() {
  return <Table data={data} columns={columns} />;
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `Record<string, any>[]` | - | Array of data rows |
| `columns` | `TableColumn[]` | - | Column configuration array |
| `variant` | `'default' \| 'striped' \| 'bordered' \| 'minimal'` | `'default'` | Table styling variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Table size/spacing |
| `hoverable` | `boolean` | `false` | Whether rows highlight on hover |
| `loading` | `boolean` | `false` | Whether table is in loading state |
| `loadingMessage` | `string` | `'Loading...'` | Message to show while loading |
| `emptyMessage` | `string` | `'No data available'` | Message when no data |
| `onRowClick` | `(row: any, index: number) => void` | - | Row click handler |
| `className` | `string` | `''` | Additional CSS classes |
| `style` | `Record<string, string \| number>` | `{}` | Inline styles |
| `data-testid` | `string` | - | Test ID for testing frameworks |

## Column Configuration

Each column is defined by a `TableColumn` object:

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Data property key |
| `label` | `string` | Column header label |
| `sortable` | `boolean` | Whether column is sortable |
| `render` | `(value, row, index) => JSX.Element \| string` | Custom cell renderer |
| `width` | `string` | Column width (CSS value) |
| `align` | `'left' \| 'center' \| 'right'` | Text alignment |

## Variants

### Default
Standard table with clean borders and spacing.

```tsx
<Table data={data} columns={columns} variant="default" />
```

### Striped
Alternating row background colors for better readability.

```tsx
<Table data={data} columns={columns} variant="striped" />
```

### Bordered
Full borders around all cells.

```tsx
<Table data={data} columns={columns} variant="bordered" />
```

### Minimal
Clean design with minimal borders.

```tsx
<Table data={data} columns={columns} variant="minimal" />
```

## Size Options

Control table density and spacing:

```tsx
{/* Compact table */}
<Table data={data} columns={columns} size="sm" />

{/* Standard table (default) */}
<Table data={data} columns={columns} size="md" />

{/* Spacious table */}
<Table data={data} columns={columns} size="lg" />
```

## Sorting

Enable sorting on specific columns:

```tsx
const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'age', label: 'Age', sortable: true },
  { key: 'email', label: 'Email' }, // Not sortable
];

<Table data={data} columns={columns} />
```

## Custom Cell Rendering

Customize how data is displayed in cells:

```tsx
const columns = [
  { 
    key: 'name', 
    label: 'Name',
    render: (value, row) => <strong>{value}</strong>
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => (
      <span style={{ 
        color: value === 'active' ? 'green' : 'red',
        fontWeight: 'bold'
      }}>
        {value}
      </span>
    )
  },
  {
    key: 'actions',
    label: 'Actions',
    render: (_, row) => (
      <button onClick={() => handleEdit(row.id)}>
        Edit
      </button>
    )
  }
];
```

## Loading and Empty States

Handle loading and empty data scenarios:

```tsx
// Loading state
<Table 
  data={[]} 
  columns={columns} 
  loading={true}
  loadingMessage="Fetching data..."
/>

// Empty state
<Table 
  data={[]} 
  columns={columns}
  emptyMessage="No users found"
/>
```

## Interactive Rows

Make rows clickable:

```tsx
<Table 
  data={data} 
  columns={columns}
  hoverable={true}
  onRowClick={(row, index) => {
    console.log('Clicked row:', row);
    navigateToDetail(row.id);
  }}
/>
```

## Examples

### User Management Table
```tsx
const users = [
  { 
    id: 1, 
    name: 'John Doe', 
    email: 'john@example.com', 
    role: 'Admin',
    status: 'active',
    lastLogin: '2024-01-15'
  },
  // ... more users
];

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
  { 
    key: 'role', 
    label: 'Role',
    render: (value) => (
      <span className={`role-badge role-${value.toLowerCase()}`}>
        {value}
      </span>
    )
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value) => (
      <span style={{ color: value === 'active' ? '#10b981' : '#ef4444' }}>
        {value}
      </span>
    )
  },
  { key: 'lastLogin', label: 'Last Login', sortable: true }
];

<Table 
  data={users}
  columns={columns}
  variant="striped"
  hoverable={true}
  onRowClick={(user) => viewUserProfile(user.id)}
/>
```

### Product Inventory Table
```tsx
const products = [
  { id: 1, name: 'Laptop', price: 999.99, stock: 15, category: 'Electronics' },
  // ... more products
];

const columns = [
  { key: 'name', label: 'Product', sortable: true },
  { key: 'category', label: 'Category' },
  {
    key: 'price',
    label: 'Price',
    sortable: true,
    align: 'right' as const,
    render: (value) => `$${value.toFixed(2)}`
  },
  {
    key: 'stock',
    label: 'Stock',
    sortable: true,
    align: 'center' as const,
    render: (value) => (
      <span style={{ 
        color: value < 5 ? '#ef4444' : value < 10 ? '#f59e0b' : '#10b981' 
      }}>
        {value}
      </span>
    )
  }
];

<Table 
  data={products}
  columns={columns}
  variant="bordered"
  size="lg"
/>
```

## Accessibility

- Proper table semantics with `<table>`, `<thead>`, `<tbody>`, `<th>`, and `<td>` elements
- Sortable columns include appropriate ARIA attributes
- Keyboard navigation support for sortable headers
- Screen reader friendly column headers and data
- High contrast support for all variants

## Responsive Behavior

- Automatically scrolls horizontally on smaller screens
- Container provides proper overflow handling
- Maintains table structure across device sizes
- Columns can be given fixed widths for better control

## Performance Notes

- Sorting is handled client-side for small datasets
- For large datasets, consider server-side sorting
- Custom renderers should be memoized for optimal performance
- Loading states prevent layout shifts during data fetching

## Best Practices

1. **Use sortable columns** for data that users need to order
2. **Provide loading states** for async data fetching
3. **Custom renderers** for complex data formatting
4. **Consistent column widths** for better visual alignment
5. **Accessible labels** that clearly describe column content
