import { useNavigate } from 'react-router';

import { Flex } from 'components/Flex';
import { FromBelowReveal } from 'components/Animations/FromBelowReveal';
import { Button } from 'components/Button';
import { paths } from 'globals/paths';

export function Welcome() {
  const navigate = useNavigate();

  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      width="100%"
    >
      <FromBelowReveal delayMs={400}>
        <h1>Welcome (guest)</h1>
        <p>This is the welcome page for guests</p>
        <Button
          variant="tertiary"
          size="small"
          label="Calculator"
          onClick={() => navigate(paths.flow.calculator.intro)}
        />
      </FromBelowReveal>
    </Flex>
  );
}
