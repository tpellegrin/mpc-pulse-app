import { createGlobalStyle } from 'styled-components';

import { scrollerInner } from 'styles/mixins';

/**
 * Global page padding utility.
 * Apply to MainLayout's inner content via `contentInnerClassName="page-padding"`.
 */
export const PagePaddingStyles = createGlobalStyle`
  .page-padding {
    ${scrollerInner({
      paddingInline: 'clamp(24px, 3vw, 64px)',
      paddingBlock: 'clamp(32px, 4vh, 96px)',
    })}
  }
`;
