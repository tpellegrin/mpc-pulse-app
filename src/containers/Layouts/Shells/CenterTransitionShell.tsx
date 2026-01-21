import React from 'react';

import { MainLayout } from 'containers/Layouts/MainLayout';
import { CenterAnimatedOutlet } from 'components/AnimatedOutlet/CenterAnimatedOutlet';
import { LayoutChromeContext } from 'containers/Layouts/common/LayoutChromeContext';
import type {
  HeaderProp,
  FooterProp,
} from 'containers/Layouts/MainLayout/types';

/**
 * CenterTransitionShell
 *
 * Persistent layout shell that renders header/footer once and only animates
 * the center content using CenterAnimatedOutlet. Place this as the `element`
 * for a parent route and define all pages as its children.
 */
export function CenterTransitionShell() {
  const [headerNode, setHeaderNode] = React.useState<HeaderProp | null>(null);
  const [footerNode, setFooterNode] = React.useState<FooterProp | null>(null);

  return (
    <LayoutChromeContext.Provider
      value={{ setHeader: setHeaderNode, setFooter: setFooterNode }}
    >
      <MainLayout
        header={headerNode ?? undefined}
        footer={footerNode ?? undefined}
      >
        {/* Only the outlet (center content) slides; header/footer remain static */}
        <CenterAnimatedOutlet />
      </MainLayout>
    </LayoutChromeContext.Provider>
  );
}
