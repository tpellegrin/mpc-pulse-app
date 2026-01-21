import React from 'react';

import { ButtonBase } from 'components/ButtonBase';
import { Button } from 'components/Button';
import { LayoutProgress } from 'containers/Layouts/common/LayoutProgress';
import { LayoutHeader } from 'containers/Layouts/common/LayoutHeader';

import type { Props } from './types';

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
          <Button
            variant="tertiary"
            size="small"
            label="←"
            aria-label="Go back"
            {...prevButton}
            isCompact
          />
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
