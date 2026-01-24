import React, { useCallback, useId, useMemo, useRef } from 'react';

import { Text } from 'components/Text';
import type { Props as TextProps } from 'components/Text/types';
import { Control } from '../common/Control';

import {
  _RangeRoot,
  _RangeTrack,
  _RangeThumb,
  _RangeThumbContent,
  _RangeMinMaxFootnote,
} from './styles';
import type { Props, RangeSegment, RangeSegments } from './types';
import { usePointerRangeLogic } from './logic';

export const Range: React.FC<Props> = ({
  min = 0,
  max = 100,
  value,
  step = 1,
  minLabel,
  maxLabel,
  onValueChange,
  onValueCommit,
  disabled,
  readOnly,
  isLoading,
  startAdornment,
  endAdornment,
  variant = 'flat',
  type = 'money',
  id: idProp,
  locale,
  currency,
  controlSize = 'medium',
  status = 'default',
  className,
  'aria-describedby': ariaDescribedBy,
  'aria-labelledby': ariaLabelledBy,
  hideFootnote = false,
  segments,
  dimUnfilled = false,
  thumbAlign = 'value',
  ...restInputProps
}) => {
  const safeMin = Number.isFinite(min) ? Number(min) : 0;
  const safeMax = Number.isFinite(max) ? Number(max) : 100;
  const [mMin, mMax] = safeMin < safeMax ? [safeMin, safeMax] : [0, 100];
  const sStep = step && step > 0 ? step : 1;
  const size = controlSize;
  const hasError = status === 'error';
  const reactId = useId();
  const name = (restInputProps as { name?: string }).name;
  const id = idProp ?? `${name ?? 'range'}-${reactId}`;
  const footnoteId = `${id}-footnote`;
  const isVisuallyDisabled = !!disabled || !!isLoading;

  const dir = typeof document !== 'undefined' ? document.dir : 'ltr';
  const isRtl = dir === 'rtl';

  const numberFormatter = useMemo(() => {
    if (type === 'percentage')
      return new Intl.NumberFormat(undefined, {
        style: 'percent',
        maximumFractionDigits: 0,
      });
    if (type === 'money' && locale && currency) {
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        });
      } catch {}
    }
    return new Intl.NumberFormat();
  }, [type, locale, currency]);

  const getFormattedValue = useCallback(
    (val: number): string => {
      if (type === 'percentage') return `${val}%`;
      if (type === 'money' && numberFormatter)
        return numberFormatter.format(val);
      return String(val);
    },
    [type, numberFormatter],
  );

  const getLabel = useCallback(
    (val: number, label?: string) =>
      label ? `${label} (${getFormattedValue(val)})` : getFormattedValue(val),
    [getFormattedValue],
  );

  const {
    inputRef,
    trackRef,
    isDragging,
    sliderPct,
    handlePointerDown,
    handleNativeChange,
    handleNativeKeyDown,
    handleNativeBlur,
  } = usePointerRangeLogic({
    min: mMin,
    max: mMax,
    value,
    step: sStep,
    onValueChange,
    onValueCommit,
    isRtl,
  });

  // focus proxy for clicking Control chrome
  const fieldRef = useRef<HTMLInputElement | null>(null);
  if (!inputRef.current) inputRef.current = fieldRef.current;

  const handleRootClick: React.MouseEventHandler<
    HTMLLabelElement | HTMLDivElement
  > = useCallback(
    (e) => {
      if (readOnly || isVisuallyDisabled) {
        e.preventDefault();
        return;
      }
      fieldRef.current?.focus();
    },
    [readOnly, isVisuallyDisabled],
  );

  const textVariant: TextProps['variant'] =
    size === 'small' ? 'captionMd' : 'bodyMd';

  const makeSegmentsCss = useCallback(
    (segs: RangeSegments | undefined, minV: number, maxV: number, rtl: boolean) => {
      if (!segs || (Array.isArray(segs) && (segs as any[]).length === 0)) return undefined;
      const span = Math.max(maxV - minV, 1);

      type Stop = { startPct: number; endPct: number; color: string };
      const stops: Stop[] = Array.isArray(segs) && typeof (segs as any[])[0] === 'string'
        ? (segs as string[]).map((color, i, arr) => {
            const segW = 100 / arr.length;
            const startPct = i * segW;
            const endPct = (i + 1) * segW;
            return { startPct, endPct, color };
          })
        : (segs as RangeSegment[])
            .map(({ from, to, color }) => {
              const startPct = ((Math.max(minV, Math.min(from, maxV)) - minV) / span) * 100;
              const endPct = ((Math.max(minV, Math.min(to, maxV)) - minV) / span) * 100;
              return { startPct, endPct, color };
            })
            .filter((s) => s.endPct > s.startPct)
            .sort((a, b) => a.startPct - b.startPct);

      const segsOrdered = rtl
        ? stops
            .map((s) => ({ startPct: 100 - s.endPct, endPct: 100 - s.startPct, color: s.color }))
            .reverse()
        : stops;

      const parts = segsOrdered.map((s) => `${s.color} ${s.startPct}%, ${s.color} ${s.endPct}%`);
      return `linear-gradient(to right, ${parts.join(', ')})`;
    },
    [],
  );

  const segmentsCss = useMemo(
    () => makeSegmentsCss(segments, mMin, mMax, isRtl),
    [segments, mMin, mMax, isRtl, makeSegmentsCss],
  );

  // Compute a visual thumb percent that can be offset to segment centers (for equal segments)
  const visualThumbPct = useMemo(() => {
    if (
      thumbAlign === 'segment-center' &&
      Array.isArray(segments) &&
      (segments as any[]).length > 0 &&
      typeof (segments as any[])[0] === 'string'
    ) {
      const S = (segments as string[]).length;
      if (S > 0) {
        const v = Math.min(Math.max(value, mMin), mMax);
        const domainSpan = mMax - mMin;
        // Only apply the centered formula when domain count matches number of segments (common case)
        const approxMatches = Math.abs(domainSpan - (S - 1)) < 1e-6;
        if (approxMatches) {
          let pct = ((v - mMin + 0.5) / S) * 100; // centers: (i+0.5)/S
          pct = Math.max(0, Math.min(100, pct));
          return isRtl ? 100 - pct : pct;
        }
      }
    }
    return sliderPct;
  }, [thumbAlign, segments, value, mMin, mMax, isRtl, sliderPct]);

  return (
    <div style={{ width: '100%' }}>
      <Control
        size={size}
        status={status}
        disabled={isVisuallyDisabled}
        className={className}
        style={{ cursor: isVisuallyDisabled ? 'default' : 'pointer' }}
        onClick={handleRootClick}
      >
        {startAdornment && (
          <Control.Adornment position="start">
            {startAdornment}
          </Control.Adornment>
        )}

        <Control.Field
          as="input"
          type="range"
          $visuallyHidden
          ref={fieldRef}
          id={id}
          name={name}
          min={mMin}
          max={mMax}
          step={sStep}
          value={value}
          disabled={isVisuallyDisabled}
          readOnly={readOnly}
          aria-invalid={hasError || undefined}
          aria-valuemin={mMin}
          aria-valuemax={mMax}
          aria-valuenow={value}
          aria-valuetext={getFormattedValue(value)}
          aria-describedby={
            ariaDescribedBy ?? (hideFootnote ? undefined : footnoteId)
          }
          aria-labelledby={ariaLabelledBy}
          aria-orientation="horizontal"
          aria-readonly={readOnly || undefined}
          aria-disabled={isVisuallyDisabled || undefined}
          onChange={handleNativeChange}
          onKeyDown={handleNativeKeyDown}
          onBlur={handleNativeBlur}
          {...restInputProps}
        />

        <_RangeRoot
          data-size={size}
          data-variant={variant}
          data-disabled={isVisuallyDisabled ? 'true' : 'false'}
          data-dragging={isDragging ? 'true' : 'false'}
          $variant={variant}
        >
          <_RangeTrack
            ref={trackRef}
            onPointerDown={handlePointerDown}
            $bgCss={segmentsCss ?? undefined}
            $dimUnfilled={!!dimUnfilled}
            style={{ ['--slider-pct' as any]: `${visualThumbPct}%` }}
          >
            <_RangeThumb style={{ left: `${visualThumbPct}%` }}>
              <_RangeThumbContent />
            </_RangeThumb>
          </_RangeTrack>
        </_RangeRoot>

        {endAdornment && (
          <Control.Adornment position="end">{endAdornment}</Control.Adornment>
        )}
      </Control>

      {!hideFootnote && (
        <_RangeMinMaxFootnote id={footnoteId}>
          <Text color="tertiary" variant={textVariant}>
            {getLabel(mMin, minLabel)}
          </Text>
          <Text color="tertiary" variant={textVariant}>
            {getLabel(mMax, maxLabel)}
          </Text>
        </_RangeMinMaxFootnote>
      )}
    </div>
  );
};

Range.displayName = 'Range';
