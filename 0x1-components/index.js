/**
 * @0x1js/components - 0x1 Component Library
 * 
 * A carefully crafted component library for 0x1 applications.
 * Zero-dependency, customizable, accessible, and minimal.
 */

// UI Components
export { Button, default as ButtonDefault } from './ui/Button/Button.tsx';
export { Card, default as CardDefault } from './ui/Card/Card.tsx';

// Layout Components  
export { Container, default as ContainerDefault } from './layout/Container/Container.tsx';

// Data Components
export { Table, default as TableDefault } from './data/Table/Table.tsx';

// Feedback Components
export { 
  Toast, 
  toast,
  default as ToastDefault 
} from './feedback/Toast/Toast.tsx';

export { 
  Alert,
  SuccessAlert,
  ErrorAlert, 
  WarningAlert,
  InfoAlert,
  default as AlertDefault 
} from './feedback/Alert/Alert.tsx';

// Component categories for organized imports
export const UI = {
  Button,
  Card
};

export const Layout = {
  Container
};

export const Data = {
  Table  
};

export const Feedback = {
  Toast,
  Alert,
  SuccessAlert,
  ErrorAlert,
  WarningAlert, 
  InfoAlert,
  toast
};
