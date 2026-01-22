import React, { useEffect, useState } from 'react';

import { FlowLayout } from 'containers/Layouts/FlowLayout';
import { Flex } from 'components/Flex';
import { Button } from 'components/Button';
import { useFlowNav } from 'hooks/useFlowNav';
import { Range } from 'components/Form/Range';
import { Text } from 'components/Text';
import { useCalculator } from 'features/calculator/state';
import { t } from 'i18n';
import { FromBelowReveal } from '@components/Animations/FromBelowReveal';

export const SavingPeriod: React.FC = () => {
  const { goNext, goBack } = useFlowNav();
  const { state, setState } = useCalculator();

  const [months, setMonths] = useState(state.core?.savingPeriodMonths ?? 24);

  useEffect(() => {
    setState((s) => ({
      ...s,
      core: {
        ...s.core,
        savingPeriodMonths: months,
      },
    }));
  }, [months, setState]);

  // Display years with one decimal precision
  const termYears = (months / 12).toFixed(1);

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
              aria-label={t('calculator.poder_compra.savingPeriod.next')}
              label={t('calculator.poder_compra.savingPeriod.next')}
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
        <Text variant="accentLg">
          {t('calculator.poder_compra.savingPeriod.title')}
        </Text>
      </Flex>

      <Flex style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Flex
          direction="column"
          style={{ flex: 1, minHeight: 0, justifyContent: 'space-between' }}
        >
          <Flex justifyContent="center" alignItems="center">
            <FromBelowReveal delayMs={700}>
              <Text variant="bodyMd">
                {t('calculator.poder_compra.savingPeriod.helper')}
              </Text>
            </FromBelowReveal>
          </Flex>

          <Flex justifyContent="center" alignItems="center">
            <FromBelowReveal delayMs={700}>
              <Text
                id="lbl-credit-term"
                variant="accentLg"
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  lineHeight: 1,
                  textAlign: 'center',
                }}
                aria-live="polite"
              >
                {termYears}{' '}
                {t('calculator.poder_compra.savingPeriod.yearsLabel')}
              </Text>
            </FromBelowReveal>
          </Flex>

          <Flex justifyContent="center" alignItems="center">
            <FromBelowReveal delayMs={700}>
              <Range
                id="calc-credit-term"
                name="creditTerm"
                min={24} // 2 years
                max={60} // 5 years
                step={3} // 3-month increments
                value={months}
                onValueChange={(v) => setMonths(v)}
                type="raw"
                variant="flat"
                controlSize="medium"
                aria-labelledby="lbl-credit-term"
                minLabel="2y"
                maxLabel="5y"
              />
            </FromBelowReveal>
          </Flex>
        </Flex>
      </Flex>
    </FlowLayout>
  );
};
