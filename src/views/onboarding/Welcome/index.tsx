import { Flex } from 'components/Flex';

export function Welcome() {
  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      width="100%"
    >
      <h1>Welcome to Onboarding</h1>
      <p>Let's get you started with our application</p>
    </Flex>
  );
}
