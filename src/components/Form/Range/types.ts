import type { InputHTMLAttributes, ReactNode } from 'react';

export type RangeType = 'money' | 'percentage' | 'raw';
export type RangeVariant = 'flat' | 'low-high' | 'good-bad';

export type RangeSegment = { from: number; to: number; color: string };
export type RangeSegments = string[] | RangeSegment[];

type ControlAttributesToOmit =
  | 'value'
  | 'min'
  | 'max'
  | 'step'
  | 'onChange'
  | 'defaultValue';

export type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  ControlAttributesToOmit
> & {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  type?: RangeType;
  variant?: RangeVariant;
  locale?: string;
  currency?: string;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  isLoading?: boolean;
  controlSize?: 'small' | 'medium';
  status?: 'default' | 'error' | 'success' | 'loading';
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  onValueChange?: (value: number) => void;
  onValueCommit?: (value: number) => void;
  hideFootnote?: boolean;
  segments?: RangeSegments;
  dimUnfilled?: boolean;
  thumbAlign?: 'value' | 'segment-center';
};

export type LogicProps = Required<
  Pick<Props, 'value' | 'min' | 'max' | 'step'>
> &
  Pick<Props, 'onValueChange' | 'onValueCommit'> & {
    isRtl: boolean;
  };
