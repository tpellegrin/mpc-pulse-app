import React from 'react';

import { useNavigation } from 'globals/context/NavigationContext';
import { Flex } from 'components/Flex';
import { Button } from 'components/Button';
import { useFlowNav } from 'hooks/useFlowNav';
import { useResetAnimations } from 'globals/context/AnimationSeen';
import { paths } from 'globals/paths';
import { usePulse } from '../state/pulseContext';
import { createInitialPulseState } from '../state/pulseTypes';
import { SendResultsEmailButton } from './SendResultsEmailButton';
import { QuestionsReview } from './QuestionsReview';

export const Result: React.FC = () => {
  const { goNext } = useFlowNav();
  const resetAnimations = useResetAnimations();
  const { setState } = usePulse();
  const { isNavBlocked, scrollRef } = useNavigation();

  // Force-enable scrolling for this screen in case any prior page left the
  // unified app scroller in a locked state (overflowY: hidden)
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prev = el.style.overflowY;
    el.style.overflowY = 'auto';
    return () => {
      el.style.overflowY = prev;
    };
  }, [scrollRef]);

  const redoFlow = React.useCallback(() => {
    try {
      localStorage.removeItem('pulse:v1');
    } catch {}
    try {
      // Clear last-frame caches for all pulse pages
      sessionStorage.removeItem('FeelingImageMorphGL:pulse-intro');
      for (let n = 2; n <= 19; n++) {
        sessionStorage.removeItem(`FeelingImageMorphGL:pulse-q${n}`);
      }
    } catch {}

    // Reset in-memory state
    setState(createInitialPulseState());

    // Reset entrance animations for pulse question screens only (keep Intro as seen to avoid gating buttons)
    resetAnimations('pulse:/flow/pulse/q');

    // Navigate to the first step
    void goNext(paths.flow.pulse.intro);
  }, [goNext, resetAnimations, setState]);

  return (
    <>
      {/* Use the app's unified scroll container (BaseLayout) by rendering plain content here. */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <Flex
          direction="column"
          gap="lg"
          style={{ marginTop: 16, width: '100%' }}
        >
          <SendResultsEmailButton />
          <QuestionsReview />
          <Button
            variant="secondary"
            size="small"
            label="Refazer"
            onClick={redoFlow}
            disabled={isNavBlocked}
          />
        </Flex>
      </div>
    </>
  );
};
