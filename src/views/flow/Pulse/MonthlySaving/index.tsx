import React, { useEffect, useState } from 'react';

import { FlowLayout } from 'containers/Layouts/FlowLayout';
import { Flex } from 'components/Flex';
import { Text } from 'components/Text';
import { Button } from 'components/Button';
import { Input } from 'components/Form/Input';
import { useFlowNav } from 'hooks/useFlowNav';
import { useCalculator } from 'features/calculator/state';
import { t } from 'i18n';
import { FromBelowReveal } from 'components/Animations/FromBelowReveal';

export const MonthlySaving: React.FC = () => {
  const { goNext, goBack } = useFlowNav();
  const { state, setState } = useCalculator();

  const [monthlySaving, setMonthlySaving] = useState(
    state.core?.monthlySaving ?? 0,
  );

  const isValid = monthlySaving >= 0;

  useEffect(() => {
    setState((s) => ({
      ...s,
      core: {
        ...s.core,
        monthlySaving,
      },
    }));
  }, [monthlySaving, setState]);

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
    >
      <Flex>
        <Text variant="accentLg">
          {t('calculator.poder_compra.monthlySaving.title')}
        </Text>
      </Flex>

      <FromBelowReveal delayMs={2000}>
        <Flex>
          <div id="lbl-monthly-saving" style={{ marginBottom: 8 }}>
            {t('calculator.poder_compra.monthlySaving.helper')}
          </div>

          <Input
            id="calc-monthly-saving"
            format="currency"
            inputMode="decimal"
            placeholderNumber={5000}
            value={Number.isFinite(monthlySaving) ? monthlySaving : 0}
            onValueChange={(v) => setMonthlySaving(v ?? 0)}
            aria-labelledby="lbl-monthly-saving"
          />
        </Flex>
      </FromBelowReveal>
    </FlowLayout>
  );
};
