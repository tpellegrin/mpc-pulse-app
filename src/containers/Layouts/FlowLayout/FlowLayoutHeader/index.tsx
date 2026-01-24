import React from 'react';

import { ButtonBase } from 'components/ButtonBase';
import { LayoutProgress } from 'containers/Layouts/common/LayoutProgress';
import { LayoutHeader } from 'containers/Layouts/common/LayoutHeader';

import type { Props } from './types';
import { BackButton } from './styles';

export const FlowLayoutHeader: React.FC<Props> = ({
  prevButton,
  closeButton,
  title,
  progress,
}) => {
  return (
    <LayoutHeader
      Left={
        !!prevButton && (
          <BackButton
            aria-label={(prevButton as any)?.['aria-label'] ?? 'Go back'}
            {...prevButton}
          >
            {prevButton.children ?? <span aria-hidden="true">‹</span>}
          </BackButton>
        )
      }
      Center={title ?? null}
      Right={
        !!closeButton && (
          <ButtonBase aria-label="Close" {...closeButton}>
            ×
          </ButtonBase>
        )
      }
    >
      {progress !== undefined && <LayoutProgress progress={progress} />}
    </LayoutHeader>
  );
};

export type { Props as FlowLayoutHeaderProps } from './types';
