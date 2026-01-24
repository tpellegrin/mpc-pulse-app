import { styled, css } from 'styled-components';

import { _TextRoot as Text } from 'components/Text/styles';
import { ButtonBase } from 'components/ButtonBase';
import { onlyHoverDevice } from 'styles/media';
import type { Props } from './types';

export const TRANSITION_MS = 220;

export const _ButtonRoot = styled(ButtonBase)<{
  $variant: Props['variant'];
  $size: Props['size'];
  $isCompact: boolean;
  $isDisabled: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    box-shadow ${TRANSITION_MS}ms ease-in-out,
    border-color ${TRANSITION_MS}ms ease-in-out,
    background-color ${TRANSITION_MS}ms ease-in-out,
    color ${TRANSITION_MS}ms ease-in-out;
  gap: ${({ theme }) => theme.spacers.xs};
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.borderRadii.full};
  position: relative;
  color: ${({ theme }) => theme.colors.text.primary};
  background-color: ${({ theme }) => theme.colors.action.secondary};

  &::after {
    transition: opacity ${TRANSITION_MS}ms ease-in-out;
    opacity: 0;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: ${({ theme }) => theme.borderRadii.full};
    pointer-events: none;
  }

  @media screen and (prefers-reduced-motion: reduce) {
    transition: none;

    &::after {
      transition: none;
    }
  }

  ${onlyHoverDevice} {
    &:hover {
      box-shadow: ${({ theme }) => theme.shadows.interactionStates.hover};
    }
  }

  &:focus {
    box-shadow: ${({ theme }) => theme.shadows.interactionStates.focus};
  }

  &:active {
    box-shadow: ${({ theme }) => theme.shadows.interactionStates.active};

    &::after {
      opacity: 1;
    }
  }

  ${Text} {
    color: inherit !important;
    margin: 0 auto;
  }

  ${({ $isCompact }) =>
    $isCompact &&
    css`
      width: fit-content;
    `}

  ${({ $isDisabled, theme }) =>
    $isDisabled &&
    css`
      color: ${theme.colors.text.tertiary};
      background-color: ${theme.colors.action.disabled};
    `}

  ${({ $isDisabled, $variant, theme }) =>
    !$isDisabled &&
    $variant === 'primary' &&
    css`
      color: ${theme.colors.text.onDarkPrimary};
      background-color: ${theme.colors.action.primary};

      &::after {
        background: ${theme.colors.surface.glowOnDark};
      }
    `}

  ${({ $isDisabled, $variant, theme }) =>
    !$isDisabled &&
    $variant === 'secondary' &&
    css`
      color: ${theme.colors.text.primary};
      background-color: ${theme.colors.action.secondary};

      &::after {
        background: ${theme.colors.surface.glow};
      }
    `}

  ${({ $isDisabled, $variant, theme }) =>
    !$isDisabled &&
    $variant === 'tertiary' &&
    css`
      color: ${theme.colors.text.primary};
      background-color: ${theme.colors.action.tertiary};

      &::after {
        background: ${theme.colors.surface.glow};
      }
    `}

  ${({ $isDisabled, $variant, theme }) =>
    !$isDisabled &&
    $variant === 'accent' &&
    css`
      color: ${theme.colors.text.onDarkPrimary};
      background-color: ${theme.colors.action.accent};

      &::after {
        background: ${theme.colors.surface.glowOnDark};
      }
    `}

  ${({ $size, theme }) =>
    $size === 'small' &&
    css`
      min-height: ${theme.spacers.xxl};
      padding: ${theme.spacers.xs} ${theme.spacers.md};
    `}

  ${({ $size, theme }) =>
    $size === 'smallTight' &&
    css`
      min-height: ${theme.spacers.xxl};
      padding: ${theme.spacers.xs} ${theme.spacers.xs};
    `}

  ${({ $size, theme }) =>
    $size === 'medium' &&
    css`
      min-height: calc(${theme.spacers.xxl} + ${theme.spacers.xs});
      padding: ${theme.spacers.md};
    `}
`;
