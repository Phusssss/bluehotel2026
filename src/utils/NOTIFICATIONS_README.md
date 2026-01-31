# Notification System

This document explains how to use the centralized notification system implemented for the hotel management system.

## Overview

The notification system provides a consistent way to display success, error, warning, and info messages throughout the application. It uses Ant Design's `message` component under the hood and supports internationalization.

## Key Features

- **Centralized API**: Single point of control for all notifications
- **Internationalization**: Automatic translation of messages
- **Type Safety**: TypeScript interfaces for all notification functions
- **Error Handling**: Special handling for `AppError` instances
- **Convenience Functions**: Pre-built functions for common operations (CRUD, forms, auth, etc.)
- **Async Support**: Utilities for handling async operations with notifications

## Basic Usage

### Using the NotificationService directly

```typescript
import { NotificationService } from '../utils/notifications';

// Basic notifications
NotificationService.success('messages.operationSuccess');
NotificationService.error('messages.operationError');
NotificationService.warning('messages.sessionExpired');
NotificationService.info('messages.loading');

// Loading notification (returns function to hide)
const hide = NotificationService.loading('messages.processing');
// Later...
hide();

// With interpolation
NotificationService.success('messages.hotelSelected', { hotel: 'Grand Hotel' });
```

### Using the useNotifications hook (Recommended)

```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const notifications = useNotifications();

  const handleSave = async () => {
    try {
      await saveData();
      notifications.crud.saveSuccess();
    } catch (error) {
      notifications.error(error);
    }
  };

  return (
    <Button onClick={handleSave}>Save</Button>
  );
}
```

## Convenience Functions

### CRUD Operations

```typescript
const notifications = useNotifications();

// Success notifications
notifications.crud.createSuccess('Room');
notifications.crud.updateSuccess('Reservation');
notifications.crud.deleteSuccess('Customer');
notifications.crud.saveSuccess();

// Error notifications
notifications.crud.createError('Room');
notifications.crud.updateError('Reservation');
notifications.crud.deleteError('Customer');
notifications.crud.saveError();
```

### Form Operations

```typescript
const notifications = useNotifications();

notifications.form.validationError();
notifications.form.submitSuccess();
notifications.form.submitError();
notifications.form.resetSuccess();
```

### Authentication

```typescript
const notifications = useNotifications();

notifications.auth.loginSuccess();
notifications.auth.loginError();
notifications.auth.logoutSuccess();
notifications.auth.sessionExpired();
notifications.auth.accessDenied();
```

### Hotel Management

```typescript
const notifications = useNotifications();

notifications.hotel.selected('Grand Hotel');
notifications.hotel.switched('Another Hotel');
notifications.hotel.noSelection();
```

## Async Operation Utilities

For handling async operations with automatic loading, success, and error notifications:

```typescript
import { 
  withNotifications,
  withCreateNotifications,
  withUpdateNotifications,
  withDeleteNotifications,
  withFormSubmitNotifications,
  withLoadNotifications,
  withAuthNotifications
} from '../utils/asyncNotifications';

// Basic async operation
const result = await withNotifications(
  () => apiCall(),
  {
    loadingMessage: 'messages.processing',
    successMessage: 'messages.operationSuccess',
    errorMessage: 'messages.operationError'
  }
);

// CRUD operations
await withCreateNotifications(() => roomService.createRoom(data), 'Room');
await withUpdateNotifications(() => roomService.updateRoom(id, data), 'Room');
await withDeleteNotifications(() => roomService.deleteRoom(id), 'Room');

// Form submission
await withFormSubmitNotifications(() => submitForm(data));

// Data loading (no success notification)
const data = await withLoadNotifications(() => loadData(), 'Hotels');

// Authentication
await withAuthNotifications(() => signIn(), 'login');
```

## Error Handling

The system automatically handles different types of errors:

```typescript
// AppError instances use their built-in localization
const appError = new AppError('Room not found', 'ROOM_NOT_FOUND', 404);
notifications.error(appError); // Shows localized message

// Regular Error instances
const error = new Error('Something went wrong');
notifications.error(error); // Shows error.message

// String messages
notifications.error('messages.operationError'); // Shows translated message
```

## Configuration

You can configure global message settings:

```typescript
import { NotificationService } from '../utils/notifications';

NotificationService.configure({
  duration: 3, // seconds
  maxCount: 5, // maximum number of messages
  top: 24, // distance from top
  rtl: false // right-to-left layout
});
```

## Translation Keys

The system uses the following translation keys in `common.json`:

```json
{
  "messages": {
    "createSuccess": "{{entity}} created successfully",
    "createError": "Failed to create {{entity}}",
    "updateSuccess": "{{entity}} updated successfully",
    "updateError": "Failed to update {{entity}}",
    "deleteSuccess": "{{entity}} deleted successfully",
    "deleteError": "Failed to delete {{entity}}",
    "loadError": "Failed to load {{entity}}",
    "saveSuccess": "Changes saved successfully",
    "saveError": "Failed to save changes",
    "operationSuccess": "Operation completed successfully",
    "operationError": "Operation failed",
    "validationError": "Please check the form for errors",
    "submitSuccess": "Form submitted successfully",
    "submitError": "Failed to submit form",
    "resetSuccess": "Form reset successfully",
    "loginSuccess": "Welcome back!",
    "loginError": "Login failed",
    "logoutSuccess": "You have been logged out",
    "sessionExpired": "Your session has expired. Please log in again",
    "accessDenied": "Access denied. You don't have permission to perform this action",
    "hotelSelected": "{{hotel}} selected",
    "hotelSwitched": "Switched to {{hotel}}",
    "noHotelSelected": "Please select a hotel to continue",
    "loading": "Loading...",
    "processing": "Processing...",
    "saving": "Saving...",
    "deleting": "Deleting...",
    "uploading": "Uploading...",
    "downloading": "Downloading..."
  },
  "entities": {
    "room": "room",
    "reservation": "reservation",
    "customer": "customer",
    "service": "service",
    "roomType": "room type",
    "user": "user",
    "hotel": "hotel",
    "company": "company",
    "housekeepingTask": "housekeeping task",
    "maintenanceTicket": "maintenance ticket"
  }
}
```

## Migration Guide

To migrate existing code to use the new notification system:

### Before
```typescript
import { message } from 'antd';

// Old way
message.success('Room created successfully');
message.error('Failed to create room');
```

### After
```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const notifications = useNotifications();

  // New way
  notifications.crud.createSuccess('Room');
  notifications.crud.createError('Room');
}
```

## Best Practices

1. **Use the hook**: Always use `useNotifications()` in React components
2. **Use convenience functions**: Prefer `crud.createSuccess()` over generic `success()`
3. **Handle errors properly**: Let the system handle `AppError` instances automatically
4. **Use async utilities**: Use `withNotifications` for async operations
5. **Consistent entity names**: Use consistent entity names for CRUD operations
6. **Translation keys**: Always use translation keys, never hardcoded strings

## Examples

See the demo components for complete examples:
- `src/components/NotificationDemo.tsx` - Basic notification examples
- `src/components/AsyncNotificationDemo.tsx` - Async operation examples