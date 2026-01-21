import { Flex } from 'components/Flex';

export function SignIn() {
  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
      <h1>Sign In</h1>
      <p>Please enter your credentials to sign in</p>
    </Flex>
  );
}
