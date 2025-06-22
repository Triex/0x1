# Toast Component

Super efficient, lightweight toast notifications with auto-dismiss, global management, and smooth animations.

## Usage

### Basic Toast
```tsx
import { Toast } from '@0x1js/components';

function App() {
  const [showToast, setShowToast] = useState(false);

  return (
    <div>
      <button onClick={() => setShowToast(true)}>
        Show Toast
      </button>
      
      <Toast
        message="Operation completed successfully!"
        type="success"
        visible={showToast}
        onDismiss={() => setShowToast(false)}
      />
    </div>
  );
}
```

### Global Toast API (Recommended)
```tsx
import { toast } from '@0x1js/components';

function App() {
  const handleSuccess = () => {
    toast.success('Data saved successfully!');
  };

  const handleError = () => {
    toast.error('Something went wrong', {
      duration: 6000,
      action: {
        label: 'Retry',
        onClick: () => console.log('Retry clicked')
      }
    });
  };

  return (
    <div>
      <button onClick={handleSuccess}>Success Toast</button>
      <button onClick={handleError}>Error Toast</button>
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | - | Toast message content |
| `type` | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'` | Toast variant/type |
| `visible` | `boolean` | `true` | Whether toast is visible |
| `duration` | `number` | `4000` | Auto-dismiss duration in ms (0 to disable) |
| `position` | `'top-right' \| 'top-left' \| 'top-center' \| 'bottom-right' \| 'bottom-left' \| 'bottom-center'` | `'top-right'` | Screen position |
| `dismissible` | `boolean` | `true` | Whether toast can be manually dismissed |
| `onDismiss` | `() => void` | - | Callback when toast is dismissed |
| `action` | `{ label: string; onClick: () => void }` | - | Additional action button |
| `className` | `string` | `''` | Additional CSS classes |
| `data-testid` | `string` | - | Test ID for testing frameworks |

## Toast Types

### Success
Green toast for successful operations.

```tsx
toast.success('Profile updated successfully!');

// Or with component
<Toast type="success" message="Success!" visible={true} />
```

### Error
Red toast for errors and failures.

```tsx
toast.error('Failed to save data');

// With action button
toast.error('Connection failed', {
  action: {
    label: 'Retry',
    onClick: retryConnection
  }
});
```

### Warning
Orange toast for warnings and important notices.

```tsx
toast.warning('Unsaved changes will be lost');
```

### Info
Blue toast for informational messages.

```tsx
toast.info('New update available');
```

## Global Toast API

The global toast API provides convenient methods for showing toasts from anywhere in your app:

### Basic Methods
```tsx
// Show different types
toast.success('Success message');
toast.error('Error message'); 
toast.warning('Warning message');
toast.info('Info message');

// Dismiss specific toast
const toastId = toast.success('Message');
toast.dismiss(toastId);

// Clear all toasts
toast.clear();
```

### Advanced Options
```tsx
toast.success('Message', {
  duration: 6000,           // Custom duration
  position: 'top-center',   // Custom position
  dismissible: false,       // Non-dismissible
  action: {                 // Action button
    label: 'Undo',
    onClick: handleUndo
  }
});
```

## Positioning

Control where toasts appear on screen:

```tsx
// Top positions
toast.info('Top Right', { position: 'top-right' });    // Default
toast.info('Top Left', { position: 'top-left' });
toast.info('Top Center', { position: 'top-center' });

// Bottom positions  
toast.info('Bottom Right', { position: 'bottom-right' });
toast.info('Bottom Left', { position: 'bottom-left' });
toast.info('Bottom Center', { position: 'bottom-center' });
```

## Action Buttons

Add action buttons for user interaction:

```tsx
// Undo action
toast.success('Item deleted', {
  action: {
    label: 'Undo',
    onClick: () => restoreItem()
  }
});

// Retry action
toast.error('Upload failed', {
  duration: 0, // Don't auto-dismiss
  action: {
    label: 'Retry',
    onClick: () => retryUpload()
  }
});

// View details
toast.info('New message received', {
  action: {
    label: 'View',
    onClick: () => openMessage()
  }
});
```

## Examples

### Form Validation
```tsx
function UserForm() {
  const handleSubmit = async (data) => {
    try {
      await saveUser(data);
      toast.success('User created successfully!');
    } catch (error) {
      toast.error('Failed to create user', {
        action: {
          label: 'Retry',
          onClick: () => handleSubmit(data)
        }
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### File Upload Progress
```tsx
function FileUpload() {
  const handleUpload = async (file) => {
    const toastId = toast.info('Uploading file...', { 
      duration: 0,
      dismissible: false 
    });

    try {
      await uploadFile(file);
      toast.dismiss(toastId);
      toast.success('File uploaded successfully!');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Upload failed', {
        action: {
          label: 'Retry',
          onClick: () => handleUpload(file)
        }
      });
    }
  };

  return (
    <input 
      type="file" 
      onChange={(e) => handleUpload(e.target.files[0])} 
    />
  );
}
```

### Bulk Operations
```tsx
function BulkActions() {
  const handleBulkDelete = async (items) => {
    const toastId = toast.info(`Deleting ${items.length} items...`, {
      duration: 0
    });

    try {
      await deleteItems(items);
      toast.dismiss(toastId);
      toast.success(`${items.length} items deleted`, {
        action: {
          label: 'Undo',
          onClick: () => restoreItems(items)
        }
      });
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Some items could not be deleted');
    }
  };

  return (
    <button onClick={() => handleBulkDelete(selectedItems)}>
      Delete Selected
    </button>
  );
}
```

### Network Status
```tsx
function NetworkMonitor() {
  useEffect(() => {
    const handleOnline = () => {
      toast.success('Connection restored', { duration: 2000 });
    };

    const handleOffline = () => {
      toast.warning('Connection lost', { 
        duration: 0,
        position: 'top-center'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return null;
}
```

## Performance Features

### Efficient Rendering
- **Minimal DOM impact**: Only renders visible toasts
- **Smooth animations**: Hardware-accelerated CSS transforms
- **Auto-cleanup**: Automatically removes dismissed toasts from memory

### Memory Management
- **Singleton pattern**: Single ToastManager instance across app
- **Event cleanup**: Proper cleanup of timers and listeners
- **Lightweight**: No external dependencies

### Animation Optimizations
- **CSS transforms**: Uses translate3d for GPU acceleration
- **Entrance/exit**: Smooth slide and scale animations
- **Non-blocking**: Animations don't block UI interactions

## Accessibility

- **ARIA attributes**: Proper `role="alert"` and `aria-live="polite"`
- **Screen reader support**: Announces toast messages automatically  
- **Keyboard navigation**: Dismiss button is keyboard accessible
- **High contrast**: Colors meet WCAG contrast requirements
- **Focus management**: Doesn't steal focus from current element

## Best Practices

1. **Use global API**: Prefer `toast.success()` over component instances
2. **Appropriate durations**: 
   - Success: 3-4 seconds
   - Error: 5-6 seconds or persistent  
   - Info/Warning: 4-5 seconds
3. **Action buttons**: Provide actions for recoverable errors
4. **Clear messaging**: Keep messages concise and actionable
5. **Positioning**: Use consistent positioning across your app
6. **Don't spam**: Avoid showing multiple toasts for the same action

## Styling

The Toast component uses CSS-in-JS but can be customized:

```css
.toast {
  /* Custom base styles */
}

.toast--success {
  /* Custom success styles */
}

.toast--error {
  /* Custom error styles */
}
```

## TypeScript Support

Full TypeScript support with proper type definitions:

```tsx
import { ToastProps, toast } from '@0x1js/components';

// Type-safe props
const toastProps: ToastProps = {
  message: 'Typed message',
  type: 'success',
  duration: 5000
};

// Type-safe global API
toast.success('Message'); // ✅ Valid
toast.invalid('Message'); // ❌ TypeScript error
```
