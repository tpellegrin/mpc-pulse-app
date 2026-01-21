import React, { useMemo } from 'react';

import { FlowLayout } from 'containers/Layouts/FlowLayout';
import { Flex } from 'components/Flex';
import { Button } from 'components/Button';
import { AnimatedAmount } from 'components/Animations/AnimatedAmount';
import { paths } from 'globals/paths';
import { useFlowNav } from 'hooks/useFlowNav';
import { useCalculator } from 'features/calculator/state';
import { refineAffordability } from 'domain/calculator/calc';
import type { AffordabilityConfig } from 'domain/calculator/calc';
import { CenterToTopEntrance } from 'components/Animations/CenterToTopEntrance';
import { Text } from 'components/Text';
import { getLocale, t } from 'i18n';
import { FromBelowReveal } from 'components/Animations/FromBelowReveal';
import { CardBase } from '@components/CardBase';
import { Range } from 'components/Form/Range';
import { AutoFitText } from '@components/AutoFitText';
import { formatAnimatedAmount } from '@components/Animations/AnimatedAmount/util';

export const Result: React.FC = () => {
  const { goBack } = useFlowNav();
  const { state, setState } = useCalculator();
  const [ready, setReady] = React.useState(false);
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  // Advanced levers – start as empty (means "use defaults from calc")
  const [overrides, setOverrides] = React.useState<AffordabilityConfig>({});

  // Fallbacks to show initial slider positions (keep these in sync with calc defaults)
  const uiDefaults = {
    interestAPR: 10,
    propertyTaxAnnualPct: 1.0,
    insuranceAnnualPct: 0.5,
    hoaMonthly: 0,
    loanTermYears: 30,
    minEntryPct: 0.2,
    closingCostsPct: 0.04,
    reservePctOfSavings: 0.1,
  };

  const mergedConfig: Required<AffordabilityConfig> = {
    ...uiDefaults,
    ...overrides,
  };

  const output = useMemo(() => {
    // If there are no overrides at all, you *could* still call computeAffordabilitySimple.
    // Using refineAffordability everywhere keeps the code simpler.
    return refineAffordability(state.core, overrides);
  }, [state.core, overrides]);

  const effectiveDownPct =
    output.maxHomePrice > 0 ? output.downPayment / output.maxHomePrice : 0;

  const totalMonthly = output.monthly.total;

  const handleOverrideChange = <K extends keyof AffordabilityConfig>(
    key: K,
    value: AffordabilityConfig[K],
  ) => {
    setOverrides((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Derived slider values (display side) using mergedConfig
  const creditTermMonths = mergedConfig.loanTermYears * 12;

  const locale = getLocale();
  const finalFormattedAmount = formatAnimatedAmount(output.maxHomePrice, {
    format: 'currency' as const,
    currency: undefined, // or 'BRL', etc., same as AnimatedAmount
    maximumFractionDigits: undefined,
    useGrouping: true,
    locale,
    formatter: undefined,
  });

  const contentRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <FlowLayout
      header={{}}
      fixedFooter
      stickyHeader
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
              onClick={() => {
                setState(() => ({
                  core: {
                    currentSavings: 0,
                    monthlySaving: 0,
                    savingPeriodMonths: 0,
                    maxInstallment: 0,
                  },
                  advanced: undefined,
                  derived: undefined,
                }));
                void goBack(paths.flow.calculator.intro);
              }}
              aria-label={t('calculator.poder_compra.result.actions.redo')}
              label={t('calculator.poder_compra.result.actions.redo')}
              size="medium"
              variant="tertiary"
            />
            <Button
              onClick={() => goBack(paths.welcome)}
              label={t('calculator.poder_compra.result.actions.done')}
              size="medium"
              variant="primary"
            />
          </Flex>
        ),
      }}
      contentRef={contentRef}
      scrollLockForMs={4500}
    >
      <CenterToTopEntrance
        delayMs={3500}
        durationMs={1000}
        onDone={() => setReady(true)}
      >
        <Flex alignItems="center" direction="column" gap="sm">
          <FromBelowReveal in={ready}>
            <Text>{t('calculator.poder_compra.result.title')}</Text>
          </FromBelowReveal>
          <AutoFitText
            autoFit
            mode="single"
            align="center"
            measureContainerRef={contentRef}
            measureText={
              <Text as="span" variant="accentXl" numeric="tabular">
                {finalFormattedAmount}
              </Text>
            }
          >
            <AnimatedAmount
              variant="accentXl"
              value={output.maxHomePrice}
              easing="easeInOut"
              durationMs={4000}
            />
          </AutoFitText>
          <FromBelowReveal in={ready}>
            <Text as="span">
              {t('calculator.poder_compra.result.subtitle', {
                // if you have i18n interpolation; otherwise just show a simple string
                // example: "Valor máximo estimado do imóvel"
              })}
            </Text>
          </FromBelowReveal>
        </Flex>
      </CenterToTopEntrance>

      <FromBelowReveal in={ready}>
        <Flex direction="column" gap="md">
          {/* Summary / explanation cards */}
          <CardBase>
            <Text>{t('calculator.poder_compra.result.summary.main')}</Text>
          </CardBase>

          {/* Advanced levers toggle */}
          <CardBase>
            <Flex direction="column" gap="sm">
              <Flex justifyContent="space-between" alignItems="center">
                <Text>
                  {t('calculator.poder_compra.result.advanced.title')}
                </Text>
                <Button
                  size="small"
                  onClick={() => setAdvancedOpen((v) => !v)}
                  label={
                    advancedOpen
                      ? t('calculator.poder_compra.result.advanced.hide')
                      : t('calculator.poder_compra.result.advanced.show')
                  }
                />
              </Flex>

              {advancedOpen && (
                <Flex direction="column" gap="md">
                  {/* Interest rate */}
                  <Flex direction="column" gap="xs">
                    <Text as="label">
                      {t('calculator.poder_compra.result.advanced.interestAPR')}
                    </Text>
                    <Range
                      id="calc-interest"
                      name="interestAPR"
                      min={2}
                      max={20}
                      step={0.5}
                      value={mergedConfig.interestAPR}
                      onValueChange={(v) =>
                        handleOverrideChange('interestAPR', v)
                      }
                      type="raw"
                      variant="flat"
                      controlSize="medium"
                      aria-labelledby="calc-interest"
                      minLabel="2%"
                      maxLabel="20%"
                    />
                    <Text>{mergedConfig.interestAPR.toFixed(1)}% APR</Text>
                  </Flex>

                  {/* Credit term (loan term in years, slider in months) */}
                  <Flex direction="column" gap="xs">
                    <Text as="label">
                      {t(
                        'calculator.poder_compra.result.advanced.loanTermYears',
                      )}
                    </Text>
                    <Range
                      id="calc-credit-term"
                      name="creditTerm"
                      min={24} // 2 years
                      max={420} // 35 years, adjust for your market
                      step={12}
                      value={creditTermMonths}
                      onValueChange={(months) =>
                        handleOverrideChange('loanTermYears', months / 12)
                      }
                      type="raw"
                      variant="flat"
                      controlSize="medium"
                      aria-labelledby="calc-credit-term"
                      minLabel="2y"
                      maxLabel="35y"
                    />
                    <Text>
                      {mergedConfig.loanTermYears.toFixed(0)}{' '}
                      {t('calculator.poder_compra.result.advanced.years')}
                    </Text>
                  </Flex>

                  {/* Property tax */}
                  <Flex direction="column" gap="xs">
                    <Text as="label">
                      {t(
                        'calculator.poder_compra.result.advanced.propertyTaxAnnualPct',
                      )}
                    </Text>
                    <Range
                      id="calc-tax"
                      name="propertyTaxAnnualPct"
                      min={0}
                      max={3}
                      step={0.1}
                      value={mergedConfig.propertyTaxAnnualPct}
                      onValueChange={(v) =>
                        handleOverrideChange('propertyTaxAnnualPct', v)
                      }
                      type="raw"
                      variant="flat"
                      controlSize="medium"
                      aria-labelledby="calc-tax"
                      minLabel="0%"
                      maxLabel="3%"
                    />
                    <Text>
                      {mergedConfig.propertyTaxAnnualPct.toFixed(1)}% / ano
                    </Text>
                  </Flex>

                  {/* Insurance */}
                  <Flex direction="column" gap="xs">
                    <Text as="label">
                      {t(
                        'calculator.poder_compra.result.advanced.insuranceAnnualPct',
                      )}
                    </Text>
                    <Range
                      id="calc-insurance"
                      name="insuranceAnnualPct"
                      min={0}
                      max={2}
                      step={0.1}
                      value={mergedConfig.insuranceAnnualPct}
                      onValueChange={(v) =>
                        handleOverrideChange('insuranceAnnualPct', v)
                      }
                      type="raw"
                      variant="flat"
                      controlSize="medium"
                      aria-labelledby="calc-insurance"
                      minLabel="0%"
                      maxLabel="2%"
                    />
                    <Text>
                      {mergedConfig.insuranceAnnualPct.toFixed(1)}% / ano
                    </Text>
                  </Flex>

                  {/* HOA */}
                  <Flex direction="column" gap="xs">
                    <Text as="label">
                      {t('calculator.poder_compra.result.advanced.hoaMonthly')}
                    </Text>
                    <Range
                      id="calc-hoa"
                      name="hoaMonthly"
                      min={0}
                      max={5000} // adjust to your market
                      step={50}
                      value={mergedConfig.hoaMonthly}
                      onValueChange={(v) =>
                        handleOverrideChange('hoaMonthly', v)
                      }
                      type="raw"
                      variant="flat"
                      controlSize="medium"
                      aria-labelledby="calc-hoa"
                      minLabel="0"
                      maxLabel="5k"
                    />
                    <Text>
                      {t('calculator.poder_compra.result.advanced.hoaValue', {
                        value: mergedConfig.hoaMonthly.toFixed(0),
                      })}
                    </Text>
                  </Flex>

                  {/* Min down payment */}
                  <Flex direction="column" gap="xs">
                    <Text as="label">
                      {t('calculator.poder_compra.result.advanced.minEntryPct')}
                    </Text>
                    <Range
                      id="calc-min-down"
                      name="minEntryPct"
                      min={0.05}
                      max={0.4}
                      step={0.01}
                      value={mergedConfig.minEntryPct}
                      onValueChange={(v) =>
                        handleOverrideChange('minEntryPct', v)
                      }
                      type="raw"
                      variant="flat"
                      controlSize="medium"
                      aria-labelledby="calc-min-down"
                      minLabel="5%"
                      maxLabel="40%"
                    />
                    <Text>
                      {(mergedConfig.minEntryPct * 100).toFixed(0)}%{' '}
                      {t(
                        'calculator.poder_compra.result.advanced.minDownLabel',
                      )}
                    </Text>
                  </Flex>
                </Flex>
              )}
            </Flex>
          </CardBase>

          {/* Breakdown card */}
          <CardBase>
            <Flex direction="column" gap="sm">
              <Text>{t('calculator.poder_compra.result.summary.entry')}</Text>
              <Flex justifyContent="space-between" alignItems="baseline">
                <Text as="span">
                  {t('calculator.poder_compra.result.summary.downPayment')}
                </Text>
                <Text as="span">
                  {output.downPayment.toFixed(0)} (
                  {(effectiveDownPct * 100).toFixed(1)}%)
                </Text>
              </Flex>

              <Text style={{ marginTop: 8 }}>
                {t('calculator.poder_compra.result.summary.monthly')}
              </Text>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>
                  {t(
                    'calculator.poder_compra.result.summary.principalInterest',
                  )}
                  : {output.monthly.principalInterest.toFixed(0)}
                </li>
                <li>
                  {t('calculator.poder_compra.result.summary.tax')}:{' '}
                  {output.monthly.tax.toFixed(0)}
                </li>
                <li>
                  {t('calculator.poder_compra.result.summary.insurance')}:{' '}
                  {output.monthly.insurance.toFixed(0)}
                </li>
                <li>
                  {t('calculator.poder_compra.result.summary.hoa')}:{' '}
                  {output.monthly.hoa.toFixed(0)}
                </li>
                <li>
                  {t('calculator.poder_compra.result.summary.total')}:{' '}
                  {totalMonthly.toFixed(0)}
                </li>
              </ul>
            </Flex>
          </CardBase>
        </Flex>
      </FromBelowReveal>
    </FlowLayout>
  );
};
