import React from 'react';

import { FlowLayout } from 'containers/Layouts/FlowLayout';
import { Flex } from 'components/Flex';
import { Text } from 'components/Text';
import { Button } from 'components/Button';
import { CenterToTopEntrance } from 'components/Animations/CenterToTopEntrance';
import { FromBelowReveal } from 'components/Animations/FromBelowReveal';
import { paths } from 'globals/paths';
import { useFlowNav } from 'hooks/useFlowNav';
import { t } from 'i18n';
// import { EmojiSelectorGroup } from '@components/EmojiSelectorGroup';
import FeelingImageMorphGL from '@components/FeelingImageMorphGL';
import pic1 from 'assets/pictures/pic_1.png';
import pic2 from 'assets/pictures/pic_2.png';
import pic3 from 'assets/pictures/pic_3.png';
import pic4 from 'assets/pictures/pic_4.png';
import pic5 from 'assets/pictures/pic_5.png';

export const Intro: React.FC = () => {
  const { goNext, goBack } = useFlowNav();
  const [ready, setReady] = React.useState(false);
  // const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);

  return (
    <FlowLayout
      header={{
        prevButton: { onClick: () => goBack(paths.welcome) },
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
              aria-label={t('pulse.common.next')}
              label={t('pulse.common.next')}
              size="medium"
              variant="accent"
              disabled={!ready}
            />
          </Flex>
        ),
      }}
      fixedFooter
      stickyHeader
      contentFlexProps={{ justifyContent: 'space-between' }}
    >
      <CenterToTopEntrance delayMs={4000} onDone={() => setReady(true)}>
        <Text variant="accentMd">{t('pulse.intro.mainText')}</Text>
      </CenterToTopEntrance>
      <FromBelowReveal in={ready}>
        <FeelingImageMorphGL
          images={[pic1, pic2, pic3, pic4, pic5]}
          height={400}
          step={2}
          intensity={0}
          className="intro-morph"
          snapOnRelease
          showButtons
          buttonsOnly
          transitionDurationMs={600}
        />
      </FromBelowReveal>
      {/*<FromBelowReveal in={ready}>*/}
      {/*  <EmojiSelectorGroup*/}
      {/*    gap="xxs"*/}
      {/*    options={[*/}
      {/*      {*/}
      {/*        lottie: {*/}
      {/*          src: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1fae0/lottie.json',*/}
      {/*          loop: false,*/}
      {/*          renderer: 'svg',*/}
      {/*          startAt: { progress: 0.17 },*/}
      {/*          delay: 300,*/}
      {/*          endSlowdownFrames: 24,*/}
      {/*          endSlowdownMinSpeed: 0.25,*/}
      {/*          endSlowdownCurve: 'easeOutCubic',*/}
      {/*          endWrapSpeed: 0.5,*/}
      {/*        },*/}
      {/*        ariaLabel: 'Option 4',*/}
      {/*      },*/}
      {/*      {*/}
      {/*        lottie: {*/}
      {/*          src: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f61e/lottie.json',*/}
      {/*          loop: false,*/}
      {/*          renderer: 'svg',*/}
      {/*          startAt: { progress: 0.5 },*/}
      {/*          delay: 300,*/}
      {/*        },*/}
      {/*        ariaLabel: 'Option 4',*/}
      {/*      },*/}
      {/*      {*/}
      {/*        lottie: {*/}
      {/*          src: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f610/lottie.json',*/}
      {/*          loop: false,*/}
      {/*          renderer: 'svg',*/}
      {/*          delay: 300,*/}
      {/*        },*/}
      {/*        ariaLabel: 'Option 4',*/}
      {/*      },*/}
      {/*      {*/}
      {/*        lottie: {*/}
      {/*          src: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f642/lottie.json',*/}
      {/*          loop: false,*/}
      {/*          renderer: 'svg',*/}
      {/*          delay: 300,*/}
      {/*        },*/}
      {/*        ariaLabel: 'Option 4',*/}
      {/*      },*/}
      {/*      {*/}
      {/*        lottie: {*/}
      {/*          src: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f606/lottie.json',*/}
      {/*          loop: false,*/}
      {/*          renderer: 'svg',*/}
      {/*          delay: 300,*/}
      {/*        },*/}
      {/*        ariaLabel: 'Option 4',*/}
      {/*      },*/}
      {/*    ]}*/}
      {/*    value={selectedIdx}*/}
      {/*    onChange={setSelectedIdx}*/}
      {/*    increaseOnClickPercent={50}*/}
      {/*    ariaLabel={t('pulse.intro.mainText')}*/}
      {/*  />*/}
      {/*</FromBelowReveal>*/}
      {/*<FromBelowReveal in={ready}>*/}
      {/*  <Text>{t('pulse.intro.subtext')}</Text>*/}
      {/*</FromBelowReveal>*/}
    </FlowLayout>
  );
};
