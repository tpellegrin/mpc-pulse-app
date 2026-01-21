import type { CSSProperties } from 'react';

import type {
  Props as FlexProps,
  FlexAlignItems,
  FlexDirection,
  FlexJustifyContent,
  FlexWrap,
} from 'components/Flex/types';
import type { LottieConfig } from 'components/EmojiButton/types';

export type EmojiOption =
  | { emoji: string; ariaLabel: string }
  | { lottie: LottieConfig; ariaLabel: string };

export type Props = {
  options: EmojiOption[];
  value: number | null;
  onChange: (index: number) => void;
  increaseOnClickPercent?: number;
  baseSize?: number;
  ariaLabel?: string;
  style?: CSSProperties;
  className?: string;
  direction?: FlexDirection;
  alignItems?: FlexAlignItems;
  justifyContent?: FlexJustifyContent;
  gap?: FlexProps['gap'];
  desktopGap?: FlexProps['desktopGap'];
  flexWrap?: FlexWrap;
};
