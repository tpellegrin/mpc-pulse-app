import React from 'react';
import { useLocation } from 'react-router';
import { useTexture } from '@react-three/drei';
import { ThemeProvider } from 'styled-components';

import { withOverrides } from 'styles/themes/withOverrides';
import { useNavigation } from 'globals/context/NavigationContext';
import { FlowLayout } from 'containers/Layouts/FlowLayout';
import { Flex } from 'components/Flex';
import { Text } from 'components/Text';
import { Button } from 'components/Button';
import { CenterToTopEntrance } from 'components/Animations/CenterToTopEntrance';
import { FromBelowReveal } from 'components/Animations/FromBelowReveal';
import { paths } from 'globals/paths';
import { useFlowNav } from 'hooks/useFlowNav';
import { t } from 'i18n';
import { useAnimationSeen } from 'globals/context/AnimationSeen';
import { Range } from 'components/Form/Range';
import FeelingImageMorphGL from '@components/FeelingImageMorphGL';
import pic1 from 'assets/pictures/marcelo/pic_1.png';
import pic2 from 'assets/pictures/marcelo/pic_2.png';
import pic3 from 'assets/pictures/marcelo/pic_3.png';
import pic4 from 'assets/pictures/marcelo/pic_4.png';
import pic5 from 'assets/pictures/marcelo/pic_5.png';
import { usePulse } from '../state/pulseContext';
import { useCommitPulseIndex } from '../state/useCommitPulseIndex';

// Preload morph textures to avoid suspense flicker across transitions
(useTexture as any).preload?.([pic1, pic2, pic3, pic4, pic5]);

export const Intro: React.FC = () => {
  const { goNext, goBack } = useFlowNav();
  const { isNavBlocked } = useNavigation();
  const { pathname } = useLocation();
  const { shouldAnimate, mark } = useAnimationSeen(`pulse:${pathname}`);
  const [ready, setReady] = React.useState(!shouldAnimate);
  // const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);

  // Centralize images and morph state
  const images = React.useMemo(() => [pic1, pic2, pic3, pic4, pic5], []);

  const { state: pulse } = usePulse();
  const [morphT, setMorphT] = React.useState<number>(
    typeof pulse.introMorphIndex === 'number' ? pulse.introMorphIndex : 0,
  );

  const commitIntro = useCommitPulseIndex('introMorphIndex', images.length);

  const customTheme = React.useCallback(
    (t: any) =>
      withOverrides(t, {
        colors: {
          ...t.colors,
          action: {
            ...t.colors.action,
            accent: '#ff9946',
          },
        },
      }),
    [],
  );

  return (
    <ThemeProvider theme={customTheme}>
      <FlowLayout
        header={{
          prevButton: {
            onClick: () => {
              // Persist current selection before navigating back
              commitIntro(morphT);
              // Show transition cover and defer navigation by a frame to avoid flicker
              try { document.dispatchEvent(new Event('pulse:cover-show')); } catch {}
              const nav = () => void goBack(paths.welcome);
              if (typeof requestAnimationFrame === 'function') requestAnimationFrame(nav);
              else setTimeout(nav, 0);
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
                  // Persist current selection before navigating forward
                  commitIntro(morphT);
                  // Show transition cover synchronously and defer navigation by a frame
                  try { document.dispatchEvent(new Event('pulse:cover-show')); } catch {}
                  const nav = () => void goNext();
                  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(nav);
                  else setTimeout(nav, 0);
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
        scrollLockForMs={shouldAnimate ? 4500 : 0}
      >
        <CenterToTopEntrance
          delayMs={4000}
          onDone={() => {
            setReady(true);
            mark();
          }}
          skipHold={!shouldAnimate}
        >
          <Flex gap="xs">
            <Text variant="accentMd">{t('pulse.intro.mainText')}</Text>
            <FromBelowReveal in={ready}>
              <Text>{t('pulse.intro.subtext')}</Text>
            </FromBelowReveal>
          </Flex>
        </CenterToTopEntrance>
        <FromBelowReveal in={ready}>
          <Flex
            style={{
              flex: 1,
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FeelingImageMorphGL
              images={images}
              value={morphT}
              onChange={setMorphT}
              showSlider={false}
              height="clamp(220px, 42vh, 360px)"
              step={0.01}
              intensity={0}
              className="intro-morph"
              transitionDurationMs={450}
              persistLastFrameKey="pulse-intro"
              useSharedCanvas
            />
          </Flex>
        </FromBelowReveal>
        <FromBelowReveal in={ready}>
          <div
            style={{
              width: '90%',
              marginInline: 'auto',
            }}
          >
            <Range
              aria-label={t('pulse.intro.mainText')}
              min={0}
              max={images.length - 1}
              step={0.01}
              value={morphT}
              onValueChange={(val) => setMorphT(val)}
              onValueCommit={(v) => {
                const rounded = Math.round(v);
                setMorphT(rounded);
                commitIntro(rounded);
              }}
              hideFootnote
              segments={['#F4A6A6', '#F7C6A5', '#FFF1A8', '#DFF5E1', '#A3D5C2']}
              thumbAlign="segment-center"
            />
          </div>
        </FromBelowReveal>
      </FlowLayout>
    </ThemeProvider>
  );
};
