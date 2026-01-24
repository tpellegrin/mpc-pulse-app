import { styled } from 'styled-components';

import { ButtonBase } from '@components/ButtonBase';

export const BackButton = styled(ButtonBase)`
  position: relative;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: ${({ theme }) => theme.borderRadii.full};
  font-size: 18px;
  line-height: 1;
  color: ${({ theme }) => theme.colors.icon.primary};
  background-color: ${({ theme }) => theme.colors.action.tertiary};

  &::before {
    content: '';
    position: absolute;
    inset: -8px; /* expands to ~44px tap target */
    border-radius: inherit;
    background: transparent; /* ensure a painted box for hit-testing */
    pointer-events: auto; /* make pseudo-element catch clicks */
  }

  &:focus-visible {
    box-shadow: ${({ theme }) => theme.shadows.interactionStates.focus};
  }
`;
