import React, { useEffect, useState } from 'react';

import { FlowLayout } from 'containers/Layouts/FlowLayout';
import { Flex } from 'components/Flex';
import { Text } from 'components/Text';
import { Button } from 'components/Button';
import { useFlowNav } from 'hooks/useFlowNav';
import { useCalculator } from 'features/calculator/state';
import { t } from 'i18n';
import { FromBelowReveal } from 'components/Animations/FromBelowReveal';

import pic1 from 'assets/pictures/marcia/pic_1.png';
import pic2 from 'assets/pictures/marcia/pic_2.png';
import pic3 from 'assets/pictures/marcia/pic_3.png';
import pic4 from 'assets/pictures/marcia/pic_4.png';
import pic5 from 'assets/pictures/marcia/pic_5.png';
import FeelingImageMorphGL from '@components/FeelingImageMorphGL';

export const Q2: React.FC = () => {
  const { goNext, goBack } = useFlowNav();
  const { state, setState } = useCalculator();

  const [savings] = useState(state.core?.currentSavings ?? 0);

  const isValid = savings >= 0;

  useEffect(() => {
    setState((s) => ({
      ...s,
      core: {
        ...s.core,
        currentSavings: savings,
      },
    }));
  }, [savings, setState]);

  return (
    <FlowLayout
      header={{
        prevButton: { onClick: () => goBack() },
        progress: 'auto',
      }}
      footer={{
        children: (
          <Flex
            direction="row"
            justifyContent="center"
            gap="md"
            width="100%"
            style={{ padding: 16 }}
          >
            <Button
              onClick={() => goNext()}
              aria-label={t('calculator.poder_compra.savings.next')}
              disabled={!isValid}
              label={t('calculator.poder_compra.savings.next')}
              size="medium"
              variant="accent"
            />
          </Flex>
        ),
      }}
      fixedFooter
      stickyHeader
      contentFlexProps={{ justifyContent: 'space-between' }}
    >
      <Flex>
        <Text variant="accentLg">{t('pulse.q2.mainText')}</Text>
        <FromBelowReveal delayMs={3500}>
          <Text>{t('pulse.q2.subtext')}</Text>
        </FromBelowReveal>
      </Flex>
      <FromBelowReveal delayMs={7000}>
        <FeelingImageMorphGL
          images={[pic1, pic2, pic3, pic4, pic5]}
          height="clamp(220px, 42vh, 360px)"
          step={0.01}
          intensity={0}
          className="intro-morph"
          snapOnRelease
          transitionDurationMs={450}
          persistLastFrameKey="pulse-intro"
        />
      </FromBelowReveal>
    </FlowLayout>
  );
};
