import { useNavigate } from 'react-router';

import { Flex } from 'components/Flex';
import { Text } from 'components/Text';
import { FromBelowReveal } from 'components/Animations/FromBelowReveal';
import { Button } from 'components/Button';
import { paths } from 'globals/paths';
import { MainLayout } from 'containers/Layouts/MainLayout';
import { useResetAnimations } from 'globals/context/AnimationSeen';
import BackgroundBlobs from 'components/BackgroundBlobs';
import { Logo } from 'components/Logo';

export function Welcome() {
  const navigate = useNavigate();
  const resetAnimations = useResetAnimations();

  // TODO: move texts to i18n
  return (
    <MainLayout contentInnerClassName="page-padding">
      <BackgroundBlobs
        density={5}
        minRadius={80}
        maxRadius={320}
        speed={0.25}
        colorMode="vivid"
        wobble
        style={{ filter: 'blur(20px)' }}
      />
      {/* Watermark Logo overlay: fixed, centered, transparent, does not affect layout */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <Logo size="70vmin" style={{ opacity: 0.2 }} />
      </div>
      <Flex
        direction="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        width="100%"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <FromBelowReveal delayMs={5000}>
          <Flex gap="lg" alignItems="center">
            <Flex alignItems="center">
              <Text variant="accentXl" align="justify">
                QUIZ
              </Text>
            </Flex>
            <Flex>
              <Text variant="accentMd" align="justify">
                Este app foi criado para cuidar daqueles que fazem a missão
                acontecer.
              </Text>
              <Text variant="accentMd" align="justify">
                Por meio das perguntas a seguir, queremos entender como você
                está, seja emocionalmente, fisicamente ou espiritualmente.
              </Text>
              <Text variant="accentMd" align="justify">
                Responda com sinceridade. Não há respostas certas ou erradas.
              </Text>
              <Text variant="accentMd" align="justify">
                O mais importante é que suas respostas representem a sua
                realidade hoje.
              </Text>
            </Flex>
          </Flex>
        </FromBelowReveal>
        <FromBelowReveal delayMs={10000}>
          <Flex alignItems="center">
            <Button
              variant="tertiary"
              size="medium"
              label="Iniciar"
              onClick={() => {
                resetAnimations('pulse:');
                void navigate(paths.flow.pulse.intro);
              }}
              isCompact
            />
          </Flex>
        </FromBelowReveal>
      </Flex>
    </MainLayout>
  );
}
