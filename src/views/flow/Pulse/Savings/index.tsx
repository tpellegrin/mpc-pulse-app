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

export const Savings: React.FC = () => {
  const { goNext, goBack } = useFlowNav();
  const { state, setState } = useCalculator();

  const [savings, setSavings] = useState(state.core?.currentSavings ?? 0);

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
    >
      <Flex>
        <Text variant="accentLg">
          {t('calculator.poder_compra.savings.title')}
        </Text>
      </Flex>

      <Flex>
        <FromBelowReveal delayMs={300}>
          <div id="lbl-savings" style={{ marginBottom: 8 }}>
            {t('calculator.poder_compra.savings.helper')}
          </div>
        </FromBelowReveal>
        <FromBelowReveal delayMs={1500}>
          <Input
            id="calc-savings"
            format="currency"
            inputMode="decimal"
            placeholderNumber={5000}
            value={Number.isFinite(savings) ? savings : 0}
            onValueChange={(v) => setSavings(v ?? 0)}
            aria-labelledby="lbl-savings"
          />
        </FromBelowReveal>

        <FromBelowReveal delayMs={1500}>
          <Text color="tertiary" variant="captionMd">
            {t('calculator.poder_compra.savings.subHelper')}
          </Text>
        </FromBelowReveal>
      </Flex>

      {/*<FromBelowReveal delayMs={700}>*/}
      {/*  <Flex>*/}
      {/*    <div id="lbl-savings" style={{ marginBottom: 8 }}>*/}
      {/*      {t('calculator.poder_compra.savings.helper')}*/}
      {/*    </div>*/}

      {/*    <Input*/}
      {/*      id="calc-savings"*/}
      {/*      format="currency"*/}
      {/*      inputMode="decimal"*/}
      {/*      placeholderNumber={5000}*/}
      {/*      value={Number.isFinite(savings) ? savings : 0}*/}
      {/*      onValueChange={(v) => setSavings(v ?? 0)}*/}
      {/*      aria-labelledby="lbl-savings"*/}
      {/*    />*/}

      {/*    <Text color="tertiary" variant="captionMd">*/}
      {/*      {t('calculator.poder_compra.savings.subHelper')}*/}
      {/*    </Text>*/}
      {/*  </Flex>*/}
      {/*</FromBelowReveal>*/}
    </FlowLayout>
  );
};
