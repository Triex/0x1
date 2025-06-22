# Alert Component

Contextual feedback components that draw attention to important information or actions that users need to take.

## Usage

```tsx
import { Alert } from '@0x1js/components';

function App() {
  return (
    <Alert variant="success">
      Your profile has been updated successfully!
    </Alert>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `JSX.Element \| JSX.Element[] \| string` | - | Alert content |
| `variant` | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'` | Alert type/variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Alert size |
| `dismissible` | `boolean` | `false` | Whether alert can be dismissed |
| `onDismiss` | `() => void` | - | Callback when alert is dismissed |
| `title` | `string` | - | Optional title for the alert |
| `showIcon` | `boolean` | `true` | Whether to display variant icon |
| `icon` | `string \| JSX.Element` | - | Custom icon (overrides default) |
| `className` | `string` | `''` | Additional CSS classes |
| `style` | `Record<string, string \| number>` | `{}` | Inline styles |
| `data-testid` | `string` | - | Test ID for testing frameworks |

## Variants

### Success
Green alert for successful operations and positive feedback.

```tsx
<Alert variant="success">
  Account created successfully!
</Alert>
```

### Error
Red alert for errors, failures, and critical issues.

```tsx
<Alert variant="error">
  Unable to save changes. Please try again.
</Alert>
```

### Warning
Orange alert for warnings and important notices.

```tsx
<Alert variant="warning">
  Your subscription expires in 3 days.
</Alert>
```

### Info
Blue alert for informational messages and neutral content.

```tsx
<Alert variant="info">
  System maintenance scheduled for tonight at 2 AM.
</Alert>
```

## Sizes

Control the padding and text size of alerts:

```tsx
{/* Small alert */}
<Alert size="sm" variant="info">
  Compact alert message
</Alert>

{/* Medium alert (default) */}
<Alert size="md" variant="success">
  Standard alert message
</Alert>

{/* Large alert */}
<Alert size="lg" variant="warning">
  Spacious alert message
</Alert>
```

## Titles

Add titles to alerts for better organization:

```tsx
<Alert variant="error" title="Validation Error">
  Please fill in all required fields before submitting.
</Alert>

<Alert variant="success" title="Upload Complete">
  Your file has been uploaded and processed successfully.
</Alert>
```

## Dismissible Alerts

Make alerts dismissible with a close button:

```tsx
function DismissibleAlert() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Alert
      variant="info"
      dismissible
      onDismiss={() => setVisible(false)}
    >
      This alert can be dismissed by clicking the × button.
    </Alert>
  );
}
```

## Custom Icons

Override default icons with custom ones:

```tsx
{/* Custom string icon */}
<Alert variant="success" icon="🎉">
  Congratulations on your achievement!
</Alert>

{/* Custom JSX icon */}
<Alert 
  variant="warning" 
  icon={<CustomWarningIcon />}
>
  Custom icon alert
</Alert>

{/* No icon */}
<Alert variant="info" showIcon={false}>
  Alert without an icon
</Alert>
```

## Convenience Components

Use pre-configured components for common alert types:

```tsx
import { 
  SuccessAlert, 
  ErrorAlert, 
  WarningAlert, 
  InfoAlert 
} from '@0x1js/components';

// These are equivalent to Alert with variant prop
<SuccessAlert>Success message</SuccessAlert>
<ErrorAlert>Error message</ErrorAlert>
<WarningAlert>Warning message</WarningAlert>
<InfoAlert>Info message</InfoAlert>
```

## Examples

### Form Validation
```tsx
function SignupForm() {
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);

  const validate = (data) => {
    const newErrors = [];
    if (!data.email) newErrors.push('Email is required');
    if (!data.password) newErrors.push('Password is required');
    return newErrors;
  };

  const handleSubmit = (data) => {
    const validationErrors = validate(data);
    setErrors(validationErrors);
    
    if (validationErrors.length === 0) {
      // Submit form
      setSuccess(true);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {errors.length > 0 && (
        <ErrorAlert title="Please fix the following errors:">
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </ErrorAlert>
      )}

      {success && (
        <SuccessAlert dismissible onDismiss={() => setSuccess(false)}>
          Account created successfully! Check your email for verification.
        </SuccessAlert>
      )}

      {/* form fields */}
    </form>
  );
}
```

### System Status
```tsx
function SystemStatus() {
  const [maintenance, setMaintenance] = useState(true);
  const [apiDown, setApiDown] = useState(false);

  return (
    <div>
      {maintenance && (
        <WarningAlert 
          title="Scheduled Maintenance"
          dismissible
          onDismiss={() => setMaintenance(false)}
        >
          Our system will be down for maintenance from 2:00-4:00 AM EST.
        </WarningAlert>
      )}

      {apiDown && (
        <ErrorAlert title="Service Disruption">
          We're experiencing issues with our API. Our team is working on a fix.
        </ErrorAlert>
      )}
    </div>
  );
}
```

### Onboarding Tips
```tsx
function OnboardingTips() {
  const [tips, setTips] = useState([
    { id: 1, message: "Complete your profile to get started", dismissed: false },
    { id: 2, message: "Connect your social accounts for better experience", dismissed: false },
    { id: 3, message: "Enable notifications to stay updated", dismissed: false }
  ]);

  const dismissTip = (id) => {
    setTips(tips.map(tip => 
      tip.id === id ? { ...tip, dismissed: true } : tip
    ));
  };

  return (
    <div>
      {tips.filter(tip => !tip.dismissed).map(tip => (
        <InfoAlert
          key={tip.id}
          title="Tip"
          dismissible
          onDismiss={() => dismissTip(tip.id)}
          icon="💡"
        >
          {tip.message}
        </InfoAlert>
      ))}
    </div>
  );
}
```

### Feature Announcements
```tsx
function FeatureAnnouncement() {
  return (
    <SuccessAlert 
      title="New Feature Available!"
      size="lg"
      icon="🚀"
    >
      <p>
        We've just released our new dashboard with improved analytics 
        and better performance. 
      </p>
      <button 
        style={{ 
          marginTop: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#22c55e',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: 'pointer'
        }}
      >
        Try it now
      </button>
    </SuccessAlert>
  );
}
```

### Loading States
```tsx
function DataLoader() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <InfoAlert icon="⏳">
        Loading your data...
      </InfoAlert>
    );
  }

  if (error) {
    return (
      <ErrorAlert title="Failed to load data">
        {error.message}
      </ErrorAlert>
    );
  }

  return <div>{/* render data */}</div>;
}
```

## Accessibility

- **ARIA attributes**: Includes `role="alert"` for screen readers
- **Semantic colors**: Colors have semantic meaning that's conveyed through icons and text
- **Keyboard navigation**: Dismiss buttons are keyboard accessible
- **Screen reader support**: Content is properly announced to assistive technologies
- **Color contrast**: All variants meet WCAG color contrast requirements

## Best Practices

1. **Use appropriate variants**: Match the alert type to the message context
2. **Provide clear actions**: For errors, tell users what they can do to fix the issue
3. **Don't overuse**: Too many alerts can overwhelm users
4. **Make dismissible when appropriate**: Allow users to dismiss non-critical alerts
5. **Use titles for complex alerts**: Titles help users quickly understand the alert purpose
6. **Consider placement**: Position alerts where users expect to see feedback

## Styling

The Alert component uses CSS-in-JS but can be customized:

```css
.alert {
  /* Custom base styles */
}

.alert--success {
  /* Custom success styles */
}

.alert--error {
  /* Custom error styles */
}

.alert-title {
  /* Custom title styles */
}
```

## Integration with Forms

Alerts work well with form validation libraries:

```tsx
// With Formik
<Formik
  onSubmit={(values, { setStatus }) => {
    try {
      await submitForm(values);
      setStatus({ type: 'success', message: 'Form submitted!' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  }}
>
  {({ status }) => (
    <Form>
      {status && (
        <Alert variant={status.type}>
          {status.message}
        </Alert>
      )}
      {/* form fields */}
    </Form>
  )}
</Formik>
```
