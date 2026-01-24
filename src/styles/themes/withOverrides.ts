import type { Theme } from './types';

// DeepPartial utility to allow passing partial nested structures for overrides
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * Merge a DeepPartial<Theme> into the current theme instance.
 * Shallow merges top-level keys and allows callers to pre-spread nested
 * objects (e.g., colors.action) to preserve unspecified tokens.
 */
export function withOverrides(
  base: Theme,
  overrides: DeepPartial<Theme>,
): Theme {
  return {
    ...base,
    ...(overrides as any),
    colors: {
      ...base.colors,
      ...(overrides as any)?.colors,
    },
    gradients: {
      ...base.gradients,
      ...(overrides as any)?.gradients,
    },
    shadows: {
      ...base.shadows,
      ...(overrides as any)?.shadows,
    },
    fontFamilies: {
      ...base.fontFamilies,
      ...(overrides as any)?.fontFamilies,
    },
    fontSizes: {
      ...base.fontSizes,
      ...(overrides as any)?.fontSizes,
    },
    fontWeights: {
      ...base.fontWeights,
      ...(overrides as any)?.fontWeights,
    },
    borderRadii: {
      ...base.borderRadii,
      ...(overrides as any)?.borderRadii,
    },
    spacers: {
      ...base.spacers,
      ...(overrides as any)?.spacers,
    },
    zIndexes: {
      ...base.zIndexes,
      ...(overrides as any)?.zIndexes,
    },
  } as Theme;
}
