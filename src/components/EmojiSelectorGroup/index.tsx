import React from 'react';

import { EmojiButton } from 'components/EmojiButton';
import { Flex } from 'components/Flex';

import type { Props } from './types';

export const EmojiSelectorGroup: React.FC<Props> = ({
  options,
  value,
  onChange,
  increaseOnClickPercent = 50,
  baseSize = 40,
  ariaLabel = 'Select an option',
  style,
  className,
  direction = 'row',
  alignItems = 'center',
  justifyContent = 'space-between',
  gap,
  desktopGap,
  flexWrap = 'nowrap',
}) => {
  const refs = React.useRef<(HTMLButtonElement | HTMLAnchorElement | null)[]>(
    [],
  );

  const focusAt = (i: number) => refs.current[i]?.focus();

  const move = (dir: 1 | -1) => {
    if (!options.length) return;
    const current = value ?? 0;
    const next = (current + dir + options.length) % options.length;
    onChange(next);
    focusAt(next);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        move(1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        move(-1);
        break;
      case 'Home':
        e.preventDefault();
        onChange(0);
        focusAt(0);
        break;
      case 'End':
        e.preventDefault();
        onChange(options.length - 1);
        focusAt(options.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <Flex
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={className}
      style={style}
      direction={direction}
      alignItems={alignItems}
      justifyContent={justifyContent}
      gap={gap}
      desktopGap={desktopGap}
      flexWrap={flexWrap}
    >
      {options.map((opt, i) => {
        const isSelected = value === i;
        const key =
          'emoji' in opt ? `${opt.emoji}-${i}` : `${opt.lottie.src}-${i}`;
        return (
          <EmojiButton
            key={key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            {...('emoji' in opt
              ? { emoji: opt.emoji }
              : { lottie: opt.lottie })}
            aria-label={opt.ariaLabel}
            ariaMode="radio"
            toggleOnClick={false}
            preventFocusOnClick={false}
            selected={isSelected}
            onClick={() => onChange(i)}
            tabIndex={isSelected || (value === null && i === 0) ? 0 : -1}
            baseSize={baseSize}
            increaseOnClickPercent={increaseOnClickPercent}
          />
        );
      })}
    </Flex>
  );
};
