import { createGlobalStyle } from 'styled-components';
import { normalize } from 'styled-normalize';

import { TRANSITIONS } from 'utils/transitions/config';
import { prettyScrollbar } from './mixins';
import { typography } from './themes/typography';

export const GlobalStyle = createGlobalStyle`
  ${normalize}
  
  :root {
    --route-transition-duration: ${TRANSITIONS.duration.default}ms;
  }
  
  * {
    box-sizing: border-box;
  }
  
  html, body {
    ${prettyScrollbar()}
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    ${typography.bodyMd};
  }
  
  html, body, #root { height: 100% }

  /* Global transition clamp scoped to app root (variable-driven) */
  .app-root * {
    /* Base allow-list via CSS variables so components can extend safely */
    --transition-props: color, background-color, border-color, box-shadow;
    --transition-duration: 200ms;
    --transition-easing: ease;

    transition-property: var(--transition-props) !important;
    transition-duration: var(--transition-duration);
    transition-timing-function: var(--transition-easing);
  }
  /* Opt-in helpers (extend by setting variables locally) */
  .app-root [data-allow-motion] {
    --transition-props: transform, opacity;
  }
  .app-root [data-allow-size] {
    --transition-props: width, height, max-height, flex-basis;
  }
  .app-root [data-allow-width] {
    --transition-props: width;
  }
  .app-root [data-allow-fade] {
    --transition-props: opacity;
  }

  body.no-select {
    user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    -moz-user-select: none;
  }

  p {
    margin: 0;
    overflow-wrap: break-word;
  }
`;
