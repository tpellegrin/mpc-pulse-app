import { useNavigate } from 'react-router';

import { Flex } from 'components/Flex';
import { Text } from 'components/Text';
import { FromBelowReveal } from 'components/Animations/FromBelowReveal';
import { Button } from 'components/Button';
import { paths } from 'globals/paths';
import { MainLayout } from 'containers/Layouts/MainLayout';
import { useResetAnimations } from 'globals/context/AnimationSeen';
import BackgroundBlobs from 'components/BackgroundBlobs';

export function Welcome() {
  const navigate = useNavigate();
  const resetAnimations = useResetAnimations();

  // TODO: move texts to i18n
  return (
    <MainLayout contentInnerClassName="page-padding">
      <BackgroundBlobs
        density={4}
        minRadius={70}
        maxRadius={160}
        speed={0.1}
        colorMode="pastel"
        wobble
      />
      <Flex
        direction="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        width="100%"
      >
        <FromBelowReveal delayMs={400}>
          <Flex gap="lg">
            <Text variant="accentMd">
              Este app foi criado para cuidar daqueles que fazem a missão
              acontecer.
            </Text>
            <Text variant="accentMd">
              Por meio dessas perguntas, queremos entender como você está —
              emocionalmente, fisicamente e espiritualmente.
            </Text>
            <Text variant="accentMd">
              Responda com sinceridade. Não há respostas certas ou erradas.
            </Text>
            <Text variant="accentMd">
              O mais importante é que suas respostas representem a sua realidade
              hoje.
            </Text>
            <Button
              variant="tertiary"
              size="small"
              label="Iniciar"
              onClick={() => {
                resetAnimations('pulse:');
                void navigate(paths.flow.pulse.intro);
              }}
            />
          </Flex>
        </FromBelowReveal>
      </Flex>
    </MainLayout>
  );
}
