import React from 'react';

import type {
  HeaderProp,
  FooterProp,
} from 'containers/Layouts/MainLayout/types';

export type LayoutChromeContextValue = {
  setHeader: (node: HeaderProp | null) => void;
  setFooter: (node: FooterProp | null) => void;
};

export const LayoutChromeContext =
  React.createContext<LayoutChromeContextValue>({
    setHeader: () => {},
    setFooter: () => {},
  });
