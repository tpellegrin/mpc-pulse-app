import React from 'react';

import type { Props as ButtonBaseProps } from 'components/ButtonBase/types';

import { _EmojiButtonRoot } from './styles';
import { Props } from './types';
import { LottieEmoji } from './LottieEmoji';

export const EmojiButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  Props
>(
  (
    {
      emoji,
      lottie,
      baseSize = 40,
      increaseOnClickPercent = 0,
      selected,
      defaultSelected = false,
      onSelectedChange,
      toggleOnClick = true,
      preventFocusOnClick = true,
      resetOnBlur = false,
      ariaMode = 'toggle',
      onClick,
      ...baseProps
    },
    ref,
  ) => {
    // Uncontrolled selection fallback
    const [internalSelected, setInternalSelected] =
      React.useState(defaultSelected);
    const isSelected = selected ?? internalSelected;
    const setSelected = React.useCallback(
      (v: boolean) => {
        if (selected === undefined) setInternalSelected(v);
        onSelectedChange?.(v);
      },
      [selected, onSelectedChange],
    );

    const { onBlur, ...restBaseProps } = baseProps as ButtonBaseProps;

    const handleClick = React.useCallback(
      (
        e:
          | React.MouseEvent<HTMLButtonElement>
          | React.MouseEvent<HTMLAnchorElement>,
      ) => {
        if (toggleOnClick) {
          setSelected(!isSelected);
        }
        onClick?.(e);
      },
      [toggleOnClick, isSelected, setSelected, onClick],
    );

    const handleBlur = React.useCallback(
      (
        e:
          | React.FocusEvent<HTMLButtonElement>
          | React.FocusEvent<HTMLAnchorElement>,
      ) => {
        if (resetOnBlur) setSelected(false);
        type AnyFocusEvent =
          | React.FocusEvent<HTMLButtonElement>
          | React.FocusEvent<HTMLAnchorElement>;
        const original = onBlur as ((ev: AnyFocusEvent) => void) | undefined;
        original?.(e as AnyFocusEvent);
      },
      [resetOnBlur, setSelected, onBlur],
    );

    const baseSizePx = Math.max(1, Math.round(baseSize));
    const scale = isSelected
      ? 1 + Math.max(0, increaseOnClickPercent) / 100
      : 1;
    const isGrayed = !isSelected;

    const ariaProps =
      ariaMode === 'radio'
        ? { role: 'radio', 'aria-checked': isSelected }
        : { 'aria-pressed': isSelected };

    return (
      <_EmojiButtonRoot
        {...(restBaseProps as ButtonBaseProps)}
        ref={ref}
        onClick={handleClick}
        onBlur={handleBlur}
        blurOnClick={preventFocusOnClick}
        $baseSizePx={baseSizePx}
        $scale={scale}
        $grayscale={isGrayed}
        {...ariaProps}
      >
        {lottie ? (
          <LottieEmoji
            src={lottie.src}
            loop={lottie.loop}
            autoplay={lottie.autoplay}
            speed={lottie.speed}
            renderer={lottie.renderer}
            play={isSelected}
            startAt={lottie.startAt}
            playSegment={lottie.playSegment}
            restartOnPlay={lottie.restartOnPlay}
            freezeOnEnd={lottie.freezeOnEnd}
            delay={lottie.delay}
            // smooth finish (opt-in)
            endSlowdownFrames={lottie.endSlowdownFrames}
            endSlowdownMinSpeed={lottie.endSlowdownMinSpeed}
            endSlowdownCurve={lottie.endSlowdownCurve}
            endWrapSpeed={lottie.endWrapSpeed}
          />
        ) : (
          <span
            aria-hidden={!!(restBaseProps as ButtonBaseProps)['aria-label']}
          >
            {emoji}
          </span>
        )}
      </_EmojiButtonRoot>
    );
  },
);
