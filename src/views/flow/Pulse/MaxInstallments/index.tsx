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

export const MaxInstallment: React.FC = () => {
  const { goNext, goBack } = useFlowNav();
  const { state, setState } = useCalculator();

  const [maxInstallment, setMaxInstallment] = useState(
    state.core?.maxInstallment ?? 0,
  );
  const isValid = maxInstallment >= 0;

  useEffect(() => {
    setState((s) => ({
      ...s,
      core: {
        ...s.core,
        maxInstallment,
      },
    }));
  }, [maxInstallment, setState]);

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
          {t('calculator.poder_compra.maxInstallment.title')}
        </Text>
      </Flex>

      <FromBelowReveal delayMs={700}>
        <Flex>
          <div id="lbl-max-installment" style={{ marginBottom: 8 }}>
            {t('calculator.poder_compra.maxInstallment.helper')}
          </div>

          <Input
            id="calc-max-installment"
            format="currency"
            inputMode="decimal"
            placeholderNumber={5000}
            value={Number.isFinite(maxInstallment) ? maxInstallment : 0}
            onValueChange={(v) => setMaxInstallment(v ?? 0)}
            aria-labelledby="lbl-max-installment"
          />

          <Text color="tertiary" variant="captionMd">
            {t('calculator.poder_compra.maxInstallment.subHelper')}
          </Text>
        </Flex>
      </FromBelowReveal>
    </FlowLayout>
  );
};
