# shadcn/ui Integration Guide

This project now includes a complete **shadcn/ui** setup with all essential components ready to use in your Astro + React widgets.

## 🎯 What's Included

### Components Installed
- ✅ **Button** - Multiple variants (default, secondary, destructive, outline, ghost, link) and sizes (sm, default, lg, icon)
- ✅ **Card** - Container component with Header, Content, Footer, Title, Description
- ✅ **Input** - Styled text input with proper focus states
- ✅ **Label** - Accessible form labels
- ✅ **Dialog** - Modal dialogs with overlay and proper accessibility
- ✅ **Select** - Dropdown select with search and keyboard navigation
- ✅ **Switch** - Toggle switches for boolean settings
- ✅ **Tabs** - Tabbed interface for organizing content
- ✅ **Badge** - Status indicators with multiple variants
- ✅ **Separator** - Visual dividers
- ✅ **Dropdown Menu** - Context menus with submenus and separators
- ✅ **Textarea** - Multi-line text input

### Configuration Files
- `components.json` - shadcn/ui configuration
- `tailwind.config.js` - TailwindCSS v3 configuration with shadcn/ui theme
- `src/lib/utils.ts` - Utility functions (cn helper for class merging)
- `src/styles/global.css` - Global styles with CSS variables for theming

## 🚀 Quick Start

### Import Components
```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from '../ui';
// or
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
```

### Basic Usage Examples

#### Button
```tsx
<Button>Click me</Button>
<Button variant="outline">Outline Button</Button>
<Button size="sm">Small Button</Button>
```

#### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Form Components
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter your email" />
</div>

<div className="space-y-2">
  <Label htmlFor="message">Message</Label>
  <Textarea id="message" placeholder="Type your message..." />
</div>
```

#### Dialog
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

## 🎨 Theming

### Dark Mode
The setup includes full dark mode support. Toggle dark mode with:
```tsx
// Toggle dark mode
document.documentElement.classList.toggle('dark');

// Check if dark mode is active
const isDarkMode = document.documentElement.classList.contains('dark');
```

### Custom Colors
Edit `tailwind.config.js` to customize the color palette. The CSS variables in `src/styles/global.css` control the actual colors used.

## 📱 Widget Integration

### Using in Astro Pages
```astro
---
import Layout from "../layouts/Layout.astro";
import MyWidget from "../components/react/my-widget";
---

<Layout title="My Widget">
  <MyWidget client:only="react" />
</Layout>
```

### postMessage API Support
All widgets support configuration via postMessage:

```tsx
// Listen for configuration
useEffect(() => {
  const handleMessage = (event) => {
    if (event.data.type === 'WIDGET_CONFIG') {
      // Apply configuration
      setConfig(event.data.config);
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

### localStorage Persistence
```tsx
// Save state to localStorage
localStorage.setItem('widget-state', JSON.stringify(state));

// Restore state from localStorage
const savedState = localStorage.getItem('widget-state');
if (savedState) {
  setState(JSON.parse(savedState));
}
```

## 🔗 Live Demo

Visit `/shadcn-demo` to see all components in action with interactive examples:
- Button variants and sizes
- Form controls (Input, Label, Select, Switch, Textarea)
- Cards and layout components
- Dialogs and dropdown menus
- Tabs for content organization
- Dark mode toggle
- Widget integration example

## 📝 Best Practices

1. **Use the `cn()` utility** for conditional classes:
   ```tsx
   <Button className={cn("custom-class", someCondition && "conditional-class")}>
   ```

2. **Leverage component variants**:
   ```tsx
   <Button variant="destructive" size="lg">Delete</Button>
   ```

3. **Maintain accessibility** - all components include proper ARIA attributes

4. **Dark mode support** - all components automatically adapt to dark/light themes

5. **TypeScript support** - Full type safety with proper prop types

## 🛠️ Adding More Components

To add additional shadcn/ui components:

1. Install any missing Radix UI dependencies
2. Create the component file in `src/components/ui/`
3. Export it from `src/components/ui/index.ts`
4. Use the official shadcn/ui documentation for component code

## 🎯 Integration with Existing Widgets

You can now replace custom styled components in existing widgets with shadcn/ui components for consistency and better maintainability.