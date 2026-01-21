import { styled, css } from 'styled-components';

import { Flex } from 'components/Flex';
import { from } from 'styles/media';
import {
  hideScrollbarForce,
  prettyScrollbar,
  scrollerContainer,
} from 'styles/mixins';

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

export const ScrollViewport = styled.div<{ $scroll?: boolean }>`
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  justify-content: center;

  ${({ $scroll }) =>
    $scroll &&
    css`
      ${scrollerContainer()};
      ${prettyScrollbar()};
      // TODO: Remove forced scrollbar suppression once scroll architecture is unified.
      // This hideScrollbarForce() workaround prevents layout shifts caused by multiple
      // competing scroll containers.
      ${hideScrollbarForce()};

      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-gutter: stable;
    `}
`;
