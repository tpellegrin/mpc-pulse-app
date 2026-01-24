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
    overflow-y: hidden; /* lock viewport scrolling; app manages it */
    height: 100%;
    overscroll-behavior-y: none; /* avoid chaining to the page on mobile */
    ${typography.bodyMd};
  }
  
  html, body, #root {
    height: 100%;

    /* Disable selection and long-press callout globally */
    -webkit-user-select: none;  /* iOS Safari */
    -ms-user-select: none;      /* Old Edge */
    -moz-user-select: none;     /* Old Firefox */
    user-select: none;          /* Modern browsers */
    -webkit-touch-callout: none; /* Disable iOS long-press menu */
  }

  /* Optional: remove tap highlight on mobile */
  * {
    -webkit-tap-highlight-color: rgba(0,0,0,0);
  }

  /* Re-enable selection where it should be allowed */
  input, textarea, [contenteditable="true"], .allow-select, [data-allow-select], [data-allow-select="true"] {
    -webkit-user-select: text;
    -ms-user-select: text;
    user-select: text;
    -webkit-touch-callout: default;
  }

  /* Optional: prevent image/link drag and long-press save/share sheets */
  img, a {
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    user-drag: none;
    -webkit-touch-callout: none;
  }

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

  /* Legacy: still allow toggling no-select via class if needed */
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
