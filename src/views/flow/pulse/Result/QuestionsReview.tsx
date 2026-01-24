import React from 'react';
import { Flex } from 'components/Flex';
import { Text } from 'components/Text';
import { Range } from 'components/Form/Range';
import { t } from 'i18n';
import { usePulse } from '../state/pulseContext';
import type { PulseState } from '../state/pulseTypes';
import { useCommitPulseIndex } from '../state/useCommitPulseIndex';

const SEGMENTS = [
  '#F4A6A6',
  '#F7C6A5',
  '#FFF1A8',
  '#DFF5E1',
  '#A3D5C2',
] as const;

type ReviewItemProps = {
  tag: 'intro' | `q${number}`;
  stateKey: keyof PulseState;
};

const ReviewItem: React.FC<ReviewItemProps> = ({ tag, stateKey }) => {
  const { state } = usePulse();
  const initial = state[stateKey] as number | null | undefined;
  const [val, setVal] = React.useState<number>(
    typeof initial === 'number' ? initial : 0,
  );

  // All pulse questions currently have 5 images/options
  const commit = useCommitPulseIndex(stateKey, 5);

  // If provider state changes externally (e.g., navigating back and returning),
  // reflect it here
  React.useEffect(() => {
    const next = state[stateKey] as number | null | undefined;
    setVal(typeof next === 'number' ? next : 0);
  }, [state, stateKey]);

  const label = t(`pulse.${tag}.mainText` as any);
  // const sublabel = t(`pulse.${tag}.subtext` as any);

  return (
    <Flex
      direction="column"
      gap="md"
      width="100%"
      style={{
        padding: '16px 16px',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.08)',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <Flex direction="column" gap="xxs" style={{ width: '100%' }}>
        <Text>{label}</Text>
        {/*{sublabel ? <Text variant="bodyMd">{sublabel}</Text> : null}*/}
      </Flex>
      <Flex direction="column" gap="xxs" style={{ width: '100%' }}>
        <Range
          aria-label={label}
          min={0}
          max={4}
          step={0.01}
          value={val}
          onValueChange={(v) => setVal(v)}
          onValueCommit={(v) => {
            const rounded = Math.round(v);
            setVal(rounded);
            commit(rounded);
          }}
          hideFootnote
          segments={SEGMENTS as any}
          thumbAlign="segment-center"
        />
      </Flex>
    </Flex>
  );
};

export const QuestionsReview: React.FC = () => {
  // Build list: intro + q2..q19
  const items: ReviewItemProps[] = React.useMemo(() => {
    const arr: ReviewItemProps[] = [
      { tag: 'intro', stateKey: 'introMorphIndex' },
    ];

    for (let n = 2 as const; n <= 19; n++) {
      arr.push({
        tag: `q${n}` as any,
        stateKey: `q${n}Index` as keyof PulseState,
      });
    }

    return arr;
  }, []);

  return (
    <Flex direction="column" gap="md" style={{ width: '100%' }}>
      <Flex
        direction="column"
        gap="md"
        style={{
          width: '100%',
          maxWidth: 'min(100vw, 720px)',
          marginInline: 'auto',
        }}
      >
        {items.map((it) => (
          <ReviewItem key={`${it.tag}`} tag={it.tag} stateKey={it.stateKey} />
        ))}
      </Flex>
    </Flex>
  );
};
