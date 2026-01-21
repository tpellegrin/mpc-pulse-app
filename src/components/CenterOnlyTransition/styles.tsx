import { styled } from 'styled-components';

import { fillParent } from 'styles/mixins';

export const _CenterOnlyTransitionRoot = styled.div`
  ${fillParent};

  position: relative;
  width: 100%;
  height: auto;
  min-height: 1px;
  overflow: hidden;
  contain: layout paint;
  isolation: isolate;
`;

export const _CenterOnlyTransitionScene = styled.div<{ $overlay?: boolean }>`
  ${fillParent};

  position: ${({ $overlay }) => ($overlay ? 'absolute' : 'static')};
  inset: 0;
  width: 100%;
  height: ${({ $overlay }) => ($overlay ? '100%' : 'auto')};

  /* Overlay should absorb events while sliding to block interactions with underlay */
  pointer-events: ${({ $overlay }) => ($overlay ? 'auto' : 'auto')};
  backface-visibility: hidden;
  transform: translateZ(0);

  /* JS applies transition/transform inline on the actual animated node.
     Provide compositing hints only. */
  &[data-allow-motion] [data-center-content] {
    will-change: transform;
  }
  &[data-allow-motion] {
    will-change: transform;
  }
`;
