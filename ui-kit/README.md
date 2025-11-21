# UI Kit

This folder contains the UI components extracted from the Weet AI project.

## Contents

- `Sidebar.tsx`: The sidebar component with inputs.
- `Toolbar.tsx`: The floating toolbar with tools and actions.
- `Canvas.tsx`: The main canvas component using Konva.
- `Gallery.tsx`: The image gallery component.
- `utils.ts`: Utility functions (specifically `cn` for Tailwind class merging).
- `styles.css`: The global CSS variables and Tailwind directives.

## Dependencies

To use these components, you need to install the following dependencies in your project:

```bash
npm install lucide-react clsx tailwind-merge react-konva konva use-image
```

## Usage

1.  Copy these files into your project (e.g., `src/components/ui-kit`).
2.  Ensure you have Tailwind CSS set up.
3.  Import the components as needed:

```tsx
import { Sidebar } from './Sidebar';
import { Toolbar } from './Toolbar';
import { Canvas } from './Canvas';
import { Gallery } from './Gallery';
```

## Note on Imports

The imports for `cn` have been updated to point to `./utils`. If you move `utils.ts` to a different location (like `src/lib/utils.ts`), please update the imports in the components accordingly.
