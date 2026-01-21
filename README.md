# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## ESLint Configuration

This project uses ESLint with a comprehensive configuration for React and TypeScript. The configuration is defined in `.eslintrc.cjs` and includes:

- React and React Hooks rules
- TypeScript-specific rules
- Airbnb style guide
- Prettier integration
- Import/export validation
- Accessibility (jsx-a11y) rules

To run the linter:

```bash
# Run ESLint
npm run lint

# Run Stylelint for CSS-in-JS
npm run lint:css
```

WebStorm has built-in support for this ESLint configuration, providing real-time linting as you code.

## Animation System

The app uses a unified route and reveal animation architecture with flow (center slide) and non-flow (fade) transitions.  
It’s driven by a global motion clamp and opt-in attributes (`data-allow-*`) for predictable, accessible transitions.

See [docs/animation-system.md](docs/animation-system.md) for full details.

### Layout FLIP animations (element-level)

For smooth re-positioning of items when layout changes (e.g., justify-content center → flex-start), use the built-in FLIP utilities:

- Hook: `useFlipLayout(containerRef, deps, { selector=':scope > *', durationMs=250, easing='ease-in-out', disabled })`
- Component: `<LayoutPositionAnimator />` — a thin wrapper around the hook that sets clamp-compatible variables and `data-allow-motion`.

Example: animate a flex row when toggling alignment without animating layout properties themselves.

```tsx
import React from 'react';
import { LayoutPositionAnimator } from 'components/Animations/LayoutPositionAnimator';

export function DemoFlipRow() {
  const [start, setStart] = React.useState(false);

  return (
    <div>
      <button type="button" onClick={() => setStart((s) => !s)}>
        Toggle Align
      </button>

      <LayoutPositionAnimator
        // Animate direct children; use an inner [data-flip-target] per item if it already uses transforms
        selector=":scope > *"
        durationMs={300}
        easing="cubic-bezier(0.4, 0.0, 0.2, 1)"
        // Re-measure when alignment changes
        deps={[start]}
        // Clamp opt-in lives on the container; transitions are transform-only
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: start ? 'flex-start' : 'center',
        }}
      >
        <div style={{ width: 48, height: 48, background: '#eee' }} />
        <div style={{ width: 48, height: 48, background: '#ddd' }} />
        <div style={{ width: 48, height: 48, background: '#ccc' }} />
      </LayoutPositionAnimator>
    </div>
  );
}
```

Notes:

- Transform-only: FLIP animates with `translate3d(dx, dy, 0)`, cooperating with the global clamp.
- Reduced motion: Uses `prefers-reduced-motion` and `getAccessibleDuration()` to clamp or skip.
- Exit overlay: If rendered inside a flow exit overlay, it snaps visible with no animation.
- Cleanup: Inline `transition`, `transform`, and `will-change` are removed after play; a watchdog ensures cleanup even if `transitionend` is missed.
- Transform stacking: Add `[data-flip-target]` inside an item to avoid clobbering an existing transform on the item root.
