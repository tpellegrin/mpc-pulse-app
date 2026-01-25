import React from 'react';
import { useLocation } from 'react-router';
import { useTexture } from '@react-three/drei';
import { ThemeProvider } from 'styled-components';

import { withOverrides } from 'styles/themes/withOverrides';
import { FlowLayout } from 'containers/Layouts/FlowLayout';
import { Flex } from 'components/Flex';
import { Text } from 'components/Text';
import { Button } from 'components/Button';
import { CenterToTopEntrance } from '@components/Animations/CenterToTopEntrance';
import { FromBelowReveal } from 'components/Animations/FromBelowReveal';
import { useFlowNav } from 'hooks/useFlowNav';
import { useNavigation } from 'globals/context/NavigationContext';
import { t } from 'i18n';
import { useAnimationSeen } from 'globals/context/AnimationSeen';
import { Range } from '@components/Form/Range';
import FeelingImageMorphGL from '@components/FeelingImageMorphGL';
// Import all available picture sets so the component can switch between them
import marcelo1 from 'assets/pictures/marcelo/pic_1.png';
import marcelo2 from 'assets/pictures/marcelo/pic_2.png';
import marcelo3 from 'assets/pictures/marcelo/pic_3.png';
import marcelo4 from 'assets/pictures/marcelo/pic_4.png';
import marcelo5 from 'assets/pictures/marcelo/pic_5.png';
import marcia1 from 'assets/pictures/marcia/pic_1.png';
import marcia2 from 'assets/pictures/marcia/pic_2.png';
import marcia3 from 'assets/pictures/marcia/pic_3.png';
import marcia4 from 'assets/pictures/marcia/pic_4.png';
import marcia5 from 'assets/pictures/marcia/pic_5.png';
import abraao1 from 'assets/pictures/abraao/pic_1.png';
import abraao2 from 'assets/pictures/abraao/pic_2.png';
import abraao3 from 'assets/pictures/abraao/pic_3.png';
import abraao4 from 'assets/pictures/abraao/pic_4.png';
import abraao5 from 'assets/pictures/abraao/pic_5.png';
import mongrau1 from 'assets/pictures/mongrau/pic_1.png';
import mongrau2 from 'assets/pictures/mongrau/pic_2.png';
import mongrau3 from 'assets/pictures/mongrau/pic_3.png';
import mongrau4 from 'assets/pictures/mongrau/pic_4.png';
import mongrau5 from 'assets/pictures/mongrau/pic_5.png';
import hernandes1 from 'assets/pictures/hernandes/pic_1.png';
import hernandes2 from 'assets/pictures/hernandes/pic_2.png';
import hernandes3 from 'assets/pictures/hernandes/pic_3.png';
import hernandes4 from 'assets/pictures/hernandes/pic_4.png';
import hernandes5 from 'assets/pictures/hernandes/pic_5.png';
import nane1 from 'assets/pictures/nane/pic_1.png';
import nane2 from 'assets/pictures/nane/pic_2.png';
import nane3 from 'assets/pictures/nane/pic_3.png';
import nane4 from 'assets/pictures/nane/pic_4.png';
import nane5 from 'assets/pictures/nane/pic_5.png';
import raquel1 from 'assets/pictures/raquel/pic_1.png';
import raquel2 from 'assets/pictures/raquel/pic_2.png';
import raquel3 from 'assets/pictures/raquel/pic_3.png';
import raquel4 from 'assets/pictures/raquel/pic_4.png';
import raquel5 from 'assets/pictures/raquel/pic_5.png';
import debora1 from 'assets/pictures/debora/pic_1.png';
import debora2 from 'assets/pictures/debora/pic_2.png';
import debora3 from 'assets/pictures/debora/pic_3.png';
import debora4 from 'assets/pictures/debora/pic_4.png';
import debora5 from 'assets/pictures/debora/pic_5.png';
import { usePulse } from '../state/pulseContext';
import { useCommitPulseIndex } from '../state/useCommitPulseIndex';
import type { PulseState } from '../state/pulseTypes';

const IMAGE_SETS = {
  marcelo: [marcelo1, marcelo2, marcelo3, marcelo4, marcelo5],
  marcia: [marcia1, marcia2, marcia3, marcia4, marcia5],
  abraao: [abraao1, abraao2, abraao3, abraao4, abraao5],
  mongrau: [mongrau1, mongrau2, mongrau3, mongrau4, mongrau5],
  hernandes: [hernandes1, hernandes2, hernandes3, hernandes4, hernandes5],
  nane: [nane1, nane2, nane3, nane4, nane5],
  raquel: [raquel1, raquel2, raquel3, raquel4, raquel5],
  debora: [debora1, debora2, debora3, debora4, debora5],
} as const;

// Accent color per picture set (folder)
const ACCENT_BY_FOLDER: Record<keyof typeof IMAGE_SETS, string> = {
  marcelo: '#ff9946', // matches Intro
  marcia: '#b2dc56', // matches Q2
  abraao: '#0bae62', // new set accent
  mongrau: '#7b5bfa',
  hernandes: '#33bebe',
  nane: '#ffa7f0',
  raquel: '#ffcf56',
  debora: '#e588fc',
};

// Preload textures for all sets to avoid suspense flicker across transitions
(useTexture as any).preload?.([
  ...IMAGE_SETS.marcelo,
  ...IMAGE_SETS.marcia,
  ...IMAGE_SETS.abraao,
  ...IMAGE_SETS.mongrau,
  ...IMAGE_SETS.hernandes,
  ...IMAGE_SETS.nane,
  ...IMAGE_SETS.raquel,
  ...IMAGE_SETS.debora,
]);

export type PulseQuestionProps = {
  tag: `q${number}`; // e.g., 'q3', 'q4', ...
  accent?: string;
  picturesFolder?: keyof typeof IMAGE_SETS; // 'marcelo' | 'marcia' | 'abraao'
};

export const PulseQuestion: React.FC<PulseQuestionProps> = ({
  tag,
  accent,
  picturesFolder = 'marcia',
}) => {
  const { goNext, goBack } = useFlowNav();
  const { isNavBlocked } = useNavigation();
  const { pathname } = useLocation();
  const { shouldAnimate, mark } = useAnimationSeen(`pulse:${pathname}`);
  const [ready, setReady] = React.useState(!shouldAnimate);
  const images = React.useMemo(
    () => IMAGE_SETS[picturesFolder],
    [picturesFolder],
  );

  const stateKey = `${tag}Index` as keyof PulseState;

  const { state: pulse } = usePulse();
  const initial = pulse[stateKey];
  const [morphT, setMorphT] = React.useState<number>(
    typeof initial === 'number' ? initial : 0,
  );

  const commit = useCommitPulseIndex(stateKey as any, images.length);

  // When navigating between different question tags (q3 -> q4 -> ...),
  // this component instance may be reused by the router. Ensure the local
  // morph value reflects the stored selection for the current page, not the
  // previous page's value.
  React.useEffect(() => {
    const key = `${tag}Index` as keyof PulseState;
    const stored = pulse[key];
    setMorphT(typeof stored === 'number' ? stored : 0);
    // Reset the GL last frame is handled internally by persistLastFrameKey
    // which already varies per tag ("pulse-qN").
  }, [tag]);

  const resolvedAccent = accent ?? ACCENT_BY_FOLDER[picturesFolder];

  const customTheme = React.useCallback(
    (t: any) =>
      withOverrides(t, {
        colors: {
          ...t.colors,
          action: {
            ...t.colors.action,
            accent: resolvedAccent,
          },
        },
      }),
    [resolvedAccent],
  );

  return (
    <ThemeProvider theme={customTheme}>
      <FlowLayout
        header={{
          prevButton: {
            onClick: () => {
              commit(morphT);
              void goBack();
            },
            disabled: isNavBlocked,
          },
          progress: 'auto',
        }}
        footer={{
          children: (
            <Flex
              direction="column"
              gap="sm"
              width="100%"
              style={{
                padding: '4px 16px 16px 16px',
                maxWidth: 'min(100vw, 720px)',
                marginInline: 'auto',
              }}
            >
              <Button
                onClick={() => {
                  // Ensure current selection is persisted even if user clicks Next without releasing the slider
                  commit(morphT);
                  void goNext();
                }}
                aria-label={t('pulse.common.next')}
                label={t('pulse.common.next')}
                size="medium"
                variant="accent"
                disabled={!ready || isNavBlocked}
              />
            </Flex>
          ),
        }}
        fixedFooter
        stickyHeader
        contentFlexProps={{ justifyContent: 'space-between' }}
      >
        <CenterToTopEntrance skipHold>
          <Flex gap="xs">
            <Text variant="accentMd">{t(`pulse.${tag}.mainText` as any)}</Text>
            <FromBelowReveal delayMs={!shouldAnimate ? 0 : 1500}>
              <Text>{t(`pulse.${tag}.subtext` as any)}</Text>
            </FromBelowReveal>
          </Flex>
        </CenterToTopEntrance>
        <FromBelowReveal delayMs={!shouldAnimate ? 0 : 1550}>
          <FeelingImageMorphGL
            images={images as any}
            value={morphT}
            onChange={setMorphT}
            showSlider={false}
            height="clamp(220px, 42vh, 360px)"
            step={0.01}
            intensity={0}
            className="intro-morph"
            transitionDurationMs={450}
            persistLastFrameKey={`pulse-${tag}`}
            useSharedCanvas
          />
        </FromBelowReveal>
        <FromBelowReveal
          delayMs={!shouldAnimate ? 0 : 1600}
          onReveal={() => {
            setReady(true);
            mark();
          }}
        >
          <div
            style={{
              width: '90%',
              marginInline: 'auto',
            }}
          >
            <Range
              aria-label={t(`pulse.${tag}.mainText` as any)}
              min={0}
              max={images.length - 1}
              step={0.01}
              value={morphT}
              onValueChange={(val) => setMorphT(val)}
              onValueCommit={(v) => {
                const rounded = Math.round(v);
                setMorphT(rounded);
                commit(rounded);
              }}
              hideFootnote
              style={{ width: '100%' }}
              segments={['#F4A6A6', '#F7C6A5', '#FFF1A8', '#DFF5E1', '#A3D5C2']}
              thumbAlign="segment-center"
            />
          </div>
        </FromBelowReveal>
      </FlowLayout>
    </ThemeProvider>
  );
};
