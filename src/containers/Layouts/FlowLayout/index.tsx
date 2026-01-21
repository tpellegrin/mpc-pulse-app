import React, { isValidElement, useContext, useEffect, useMemo } from 'react';

import { OverlayRoleContext } from 'components/CenterOnlyTransition/OverlayRoleContext';
import {
  LayoutTransitionContainer,
  LayoutTransitionInner,
} from '../common/LayoutTransitionContainer/styles';
import { resolveFooter } from '../common/helpers';
import { FlowLayoutHeader, FlowLayoutHeaderProps } from './FlowLayoutHeader';
import { LayoutChromeContext } from '../common/LayoutChromeContext';

import { Props } from './types';
import { ContentColumn, ScrollViewport } from './styles';

/**
 * FlowLayout
 *
 * Purpose:
 * A page layout that provides an optional header, banner, scrollable content area, and optional footer.
 * The content area expands to fill available space and stacks children vertically.
 *
 * Usage:
 * - Pass `header` as a React node or `FlowLayoutHeaderProps` to render a standard header.
 * - Use `banner` for transient notices above the content.
 * - Provide `footer` as a React node or configuration; set `fixedFooter` to keep it docked.
 * - Control spacing with `paddingBlock` and `paddingInline`.
 * - Constrain content with `maxWidth` and `backgroundColor` / `gradient`.
 * - `stickyHeader` keeps the header pinned while scrolling (default: true).
 * - `contentFlexProps` are forwarded to the inner Flex that wraps the page content.
 *   The wrapper defaults to `style.flex = 1` so the content grows to fill the area; override via `contentFlexProps.style`.
 *
 * Example:
 * <FlowLayout header={{ title: 'Settings' }} footer={<MyFooter/>} contentFlexProps={{ gap: 'lg' }}>
 *   <Section />
 * </FlowLayout>
 */
export const FlowLayout: React.FC<Props> = ({
  children,
  banner,
  header,
  footer,
  showHeader = true,
  showFooter = true,
  paddingBlock = 'clamp(32px, 4vw, 128px)',
  paddingInline = 'clamp(24px, 3vw, 64px)',
  contentInnerClassName,
  contentFlexProps,
  contentRef,
  scrollLockForMs,
  scrollInitiallyLocked = false,
}) => {
  const resolvedHeader = useMemo(() => {
    if (!showHeader || !header) return undefined;
    if (isValidElement(header)) return header;
    const h = header as FlowLayoutHeaderProps;
    return <FlowLayoutHeader {...h} />;
  }, [header, showHeader]);

  const resolvedFooter = useMemo(
    () => resolveFooter(footer, showFooter),
    [footer, showFooter],
  );

  // Publish header/footer into the persistent shell (MainLayout) via context
  const { setHeader, setFooter } = useContext(LayoutChromeContext);
  const role = useContext(OverlayRoleContext);
  const canPublish = role !== 'exit';

  const [scrollLocked, setScrollLocked] = React.useState(
    scrollInitiallyLocked || Boolean(scrollLockForMs),
  );

  React.useEffect(() => {
    if (!scrollLockForMs) return;
    setScrollLocked(true);
    const id = window.setTimeout(() => {
      setScrollLocked(false);
    }, scrollLockForMs);
    return () => window.clearTimeout(id);
  }, [scrollLockForMs]);

  useEffect(() => {
    if (!canPublish) return;
    if (resolvedHeader) {
      setHeader(
        <div
          data-flow-header
          data-allow-fade
          style={{
            ['--transition-duration' as string]: '200ms',
            ['--transition-easing' as string]: 'ease',
          }}
        >
          {resolvedHeader}
        </div>,
      );
    } else {
      setHeader(null);
    }
    return () => {
      if (!canPublish) return;
      setHeader(null);
    };
  }, [canPublish, resolvedHeader, setHeader]);

  useEffect(() => {
    if (!canPublish) return;
    if (resolvedFooter) {
      setFooter(
        <div
          data-flow-footer
          data-allow-fade
          style={{
            ['--transition-duration' as string]: '200ms',
            ['--transition-easing' as string]: 'ease',
          }}
        >
          {resolvedFooter}
        </div>,
      );
    } else {
      setFooter(null);
    }
    return () => {
      if (!canPublish) return;
      setFooter(null);
    };
  }, [canPublish, resolvedFooter, setFooter]);

  const { style: userStyle, ...restContentFlexProps } = contentFlexProps ?? {};

  // TODO: Revisit scroll architecture.
  // Current setup uses multiple potential scroll containers (BaseLayoutContent,
  // FlowLayout, ContentColumn), which creates conflicts with transitions,
  // padding logic, and scrollbar shifting. Long-term fix is to try and consolidate
  // scrolling into a single viewport-level container (_BaseLayoutContent) and
  // introduce an inner optional scroll section for pages that need limited-
  // height scroll regions. Rework FlowLayout to support this unified model.
  return (
    <LayoutTransitionContainer
      className={contentInnerClassName}
      data-center-content
      data-allow-motion
    >
      <LayoutTransitionInner>
        {banner}
        <ScrollViewport $scroll={!scrollLocked}>
          <ContentColumn
            ref={contentRef}
            $paddingInline={paddingInline}
            $paddingBlock={paddingBlock}
            direction="column"
            gap="md"
            justifyContent="flex-start"
            alignItems="flex-start"
            style={{
              ...(userStyle ?? {}),
            }}
            {...restContentFlexProps}
          >
            {children}
          </ContentColumn>
        </ScrollViewport>
      </LayoutTransitionInner>
    </LayoutTransitionContainer>
  );
};

export * from './types';
