import { useEffect } from 'react';

/**
 * Optional hardening hook: prevent text selection and context menu on touch devices,
 * while allowing it inside inputs, textareas, contenteditable, or explicitly allowed elements.
 *
 * Usage: call once near the app root. Enabled by default.
 * TODO: maybe use Capacitor's utils here
 */
export function useDisableSelectionHardening(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const isTouchDevice =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || (navigator as any).maxTouchPoints > 0);

    if (!isTouchDevice) return;

    const isAllowed = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) return false;
      return !!target.closest(
        'input, textarea, [contenteditable="true"], .allow-select, [data-allow-select], [data-allow-select="true"]',
      );
    };

    const prevent = (e: Event) => {
      if (isAllowed(e.target)) return;
      e.preventDefault();
    };

    document.addEventListener('selectstart', prevent, { passive: false });
    document.addEventListener('contextmenu', prevent, { passive: false });

    return () => {
      document.removeEventListener('selectstart', prevent);
      document.removeEventListener('contextmenu', prevent);
    };
  }, [enabled]);
}
