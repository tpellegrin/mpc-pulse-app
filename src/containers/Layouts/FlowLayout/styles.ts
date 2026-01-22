import { styled, css } from 'styled-components';

import { Flex } from 'components/Flex';
import { from } from 'styles/media';

export const ContentColumn = styled(Flex)<{
  $paddingInline?: string;
  $paddingBlock?: string;
}>`
  /* centered, width-constrained content */
  width: 100vw;
  max-width: 100%;

  ${from.tabletPortrait} {
    width: 50vw;
  }

  ${({ $paddingInline, $paddingBlock }) => css`
    padding-inline: ${$paddingInline ?? '0'};
    padding-block: ${$paddingBlock ?? '0'};
  `}
`;

export const ScrollViewport = styled.div`
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  justify-content: center;
`;
