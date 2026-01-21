import type { Props as ButtonBaseProps } from 'components/ButtonBase/types';

export type LottieStartAt =
  | { frame: number }
  | { progress: number }
  | { marker: string };

export type LottieSegment =
  | [number, number]
  | { fromMarker: string; toMarker: string };

export type LottieConfig = {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  renderer?: 'svg' | 'canvas';
  startAt?: LottieStartAt;
  playSegment?: LottieSegment;
  restartOnPlay?: boolean;
  freezeOnEnd?: boolean;
  delay?: number; // delay (ms) before starting playback (applies to autoplay and play toggles)
  // Optional smooth finish controls (all opt-in; if omitted, no change in behavior)
  endSlowdownFrames?: number; // number of frames near end to start slowing down (e.g., 12-24)
  endSlowdownMinSpeed?: number; // fraction of base speed at the final frame (0.01..1)
  endSlowdownCurve?: 'linear' | 'easeOutCubic'; // easing for slowdown ramp
  endWrapSpeed?: number; // optional speed for the wrap segment back to start
};

export type CommonEmojiButtonProps = Omit<ButtonBaseProps, 'children'> & {
  baseSize?: number;
  increaseOnClickPercent?: number;
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (v: boolean) => void;
  toggleOnClick?: boolean;
  preventFocusOnClick?: boolean;
  resetOnBlur?: boolean;
  ariaMode?: 'toggle' | 'radio';
};

export type Props =
  | (CommonEmojiButtonProps & { emoji: string; lottie?: undefined })
  | (CommonEmojiButtonProps & { lottie: LottieConfig; emoji?: undefined });
