# VDaily Widgets - AI Coding Instructions

## Project Overview

VDaily Widgets is an Astro-based multi-framework widget library that combines React, Svelte, and Vue components into a unified daily productivity suite. The project demonstrates Astro's framework-agnostic capabilities by implementing productivity widgets (Pomodoro timer, speed reader, clock) across different frontend frameworks.

## Architecture & Multi-Framework Setup

### Core Structure

- **Astro**: Static site generator serving as the meta-framework host
- **React**: Primary framework for interactive widgets (`src/components/react/`)
- **Svelte & Vue**: Configured but unused (`src/components/svelte/`, `src/components/vue/`)
- **TailwindCSS v4**: Modern CSS framework with Vite plugin integration

### Framework Integration Pattern

```astro
<!-- Page-level component inclusion -->
<Layout>
  <PomodoroWidget client:only="react" />
</Layout>
```

- Use `client:only="react"` for stateful React components requiring hydration
- Astro components handle routing and layout structure
- Framework-specific components live in organized subdirectories

## Key Development Workflows

### Commands (pnpm-based)

```bash
pnpm dev          # Start dev server on localhost:4321
pnpm build        # Build for production to ./dist/
pnpm preview      # Preview production build
```

### Component Creation Pattern

1. **React widgets**: Place in `src/components/react/` with `.tsx` extension
2. **Page routing**: Create `.astro` files in `src/pages/`
3. **Shared layout**: Use `src/layouts/Layout.astro` for consistent structure

Example widget integration:

```astro
---
import Layout from "../layouts/Layout.astro";
import YourWidget from "../components/react/your-widget";
---

<Layout>
  <YourWidget client:only="react" />
</Layout>
```

## Project-Specific Conventions

### Widget Architecture

- **Self-contained components**: Each widget is fully functional standalone (see `pomodoro.tsx`, `reader.tsx`)
- **State management**: Local React state with `useState`/`useEffect` patterns
- **Timer patterns**: Use `useRef` for interval management in time-based widgets
- **Lucide React icons**: Consistent iconography across all widgets

### Styling Approach

- **TailwindCSS v4**: Import via `@import "tailwindcss"` in `global.css`
- **Component-scoped styles**: Inline Tailwind classes preferred over CSS modules
- **Responsive design**: Mobile-first approach with Tailwind responsive utilities

### TypeScript Configuration

- **Strict mode**: Extends `astro/tsconfigs/strict`
- **JSX setup**: `jsx: "preserve"` with React import source
- **Framework types**: Automatic type generation for Astro components

## Critical Dependencies

### Framework Integrations

- `@astrojs/react`, `@astrojs/svelte`, `@astrojs/vue`: Enable multi-framework support
- `@tailwindcss/vite`: TailwindCSS v4 Vite integration
- `antd`: UI component library (imported but not extensively used)
- `lucide-react`: Icon system for React components

### Development Notes

- **Vietnamese locale**: Layout sets `lang="vi"` - consider i18n if expanding
- **Widget isolation**: Each widget operates independently with no shared state
- **Client-side rendering**: Interactive widgets require explicit hydration directives
- **Asset handling**: Use Astro's asset pipeline for images and SVGs

## Deployment & CI/CD

### GitHub Pages Deployment

- **Auto-deployment**: Push to `main` branch triggers GitHub Actions workflow
- **Static hosting**: Built to `./dist/` and deployed to GitHub Pages
- **Base path**: Configured for `/vdaily-widgets` repository path
- **Build process**: Uses pnpm with caching for faster CI builds

### Configuration Notes

- `astro.config.mjs` includes `site` and `base` for proper GitHub Pages routing
- Workflow uses Node.js 20 and pnpm 9 for consistency
- Pages configuration handled automatically by Actions

## File Organization Patterns

```
src/
├── components/
│   ├── react/           # Interactive widgets (TSX)
│   ├── svelte/          # Future Svelte components
│   ├── vue/            # Future Vue components
│   └── Welcome.astro   # Astro-native components
├── layouts/            # Shared page layouts
├── pages/              # File-based routing
└── styles/             # Global CSS imports
```

When adding new widgets, follow the established pattern of creating dedicated React components in the appropriate framework directory and exposing them through Astro pages with proper hydration directives.
