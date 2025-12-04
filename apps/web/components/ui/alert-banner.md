# Alert Banner Component

A reusable alert/banner component system for displaying notifications, tips, warnings, and information throughout the application.

## Components

### AlertBanner
Main component for displaying alerts with icon, title, and content.

**Props:**
- `variant`: 'info' | 'warning' | 'error' | 'success' | 'tip' (default: 'info')
- `title`: Optional title text
- `children`: Content to display
- `icon`: Optional custom icon (overrides default variant icon)
- `className`: Additional CSS classes

**Usage:**
```tsx
import { AlertBanner } from '@/components/ui/alert-banner'

// Basic info alert
<AlertBanner variant="info">
  This is an informational message.
</AlertBanner>

// With title
<AlertBanner variant="warning" title="Important Notice">
  Please review the following information carefully.
</AlertBanner>

// With custom icon
<AlertBanner variant="tip" icon={<FiSettings className="w-5 h-5" />}>
  Configure your settings here.
</AlertBanner>

// Error message
<AlertBanner variant="error" title="Configuration Error">
  Missing required environment variables.
</AlertBanner>

// Success message
<AlertBanner variant="success" title="Connected">
  Your account has been successfully connected.
</AlertBanner>
```

### AlertInline
Compact inline version for smaller notifications.

**Props:**
- `variant`: 'info' | 'warning' | 'error' | 'success' | 'tip' (default: 'info')
- `children`: Content to display
- `className`: Additional CSS classes

**Usage:**
```tsx
import { AlertInline } from '@/components/ui/alert-banner'

<AlertInline variant="warning">
  This feature is in beta
</AlertInline>
```

### CodeBlock
Component for displaying code, URLs, or commands.

**Props:**
- `children`: Code/text to display
- `label`: Optional label above the code block
- `className`: Additional CSS classes

**Usage:**
```tsx
import { CodeBlock } from '@/components/ui/alert-banner'

// With label
<CodeBlock label="Webhook URL">
  https://api.example.com/webhooks/facebook
</CodeBlock>

// Without label
<CodeBlock>
  npm install @example/package
</CodeBlock>
```

## Variants

### info (default)
- Blue color scheme
- Info icon
- Use for: General information, instructions

### warning
- Yellow/amber color scheme
- Warning icon
- Use for: Warnings, cautions, important notices

### error
- Red color scheme
- Error icon
- Use for: Errors, failures, critical issues

### success
- Green color scheme
- Check circle icon
- Use for: Success messages, confirmations

### tip
- Primary color scheme
- Lightbulb icon
- Use for: Tips, helpful hints, suggestions

## Design System

All variants use the standard color tokens from `globals.css`:
- `--info`: Info variant
- `--warning`: Warning variant
- `--destructive`: Error variant
- `--success`: Success variant
- `--primary`: Tip variant

This ensures consistency across the entire application.

## Examples

### Configuration Instructions
```tsx
<AlertBanner variant="tip">
  You need to create an app in the <span className="font-semibold">Facebook developer portal</span> to get these credentials.
</AlertBanner>
```

### API Endpoint Display
```tsx
<CodeBlock label="Webhook URL">
  {process.env.NEXT_PUBLIC_API_URL}/api/v1/webhooks/facebook
</CodeBlock>
```

### Error Handling
```tsx
{error && (
  <AlertBanner variant="error" title="Connection Failed">
    {error.message}
  </AlertBanner>
)}
```

### Success Notification
```tsx
<AlertBanner variant="success" title="Configuration Saved">
  Your settings have been updated successfully.
</AlertBanner>
```

### Information Section
```tsx
<AlertBanner variant="info" title="Configuration Management" icon={<FiSettings className="w-5 h-5" />}>
  Configure API credentials for each integration. One configuration can be used to connect multiple accounts.
</AlertBanner>
```
