import { css, styled } from 'styled-components';

import { ButtonBase } from 'components/ButtonBase';

export const _EmojiButtonRoot = styled(ButtonBase).attrs({
  'data-allow-motion': true,
})<{
  $baseSizePx: number;
  $scale: number;
  $grayscale: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  background: transparent;
  border: 0;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
  --transition-props: transform, filter;

  ${({ $grayscale }) =>
    $grayscale &&
    css`
      filter: grayscale(60%);
    `}

  font-size: ${({ $baseSizePx }) => $baseSizePx}px;
  will-change: transform, filter;
  transform: translateZ(0) scale(${({ $scale }) => $scale});
  transform-origin: center;
  contain: paint;
  isolation: isolate;
  backface-visibility: hidden;

  --transition-duration: 150ms;
  --transition-easing: ease-in-out;
  transition:
    transform var(--transition-duration) var(--transition-easing),
    filter var(--transition-duration) var(--transition-easing);

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }
`;
