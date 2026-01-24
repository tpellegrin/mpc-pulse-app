export const guestPaths = {
  index: '/',
  welcome: '/welcome',
  signIn: '/sign-in',
  signUp: '/sign-up',
  transitionDemo: '/transition-demo',
} as const;

export const onboardingPaths = { onboarding: { welcome: '/welcome' } } as const;

export const userPaths = { dashboard: '/' } as const;

export const flowPaths = {
  flow: {
    pulse: {
      intro: '/flow/pulse/intro',
      q2: '/flow/pulse/q2',
      q3: '/flow/pulse/q3',
      q4: '/flow/pulse/q4',
      q5: '/flow/pulse/q5',
      q6: '/flow/pulse/q6',
      q7: '/flow/pulse/q7',
      q8: '/flow/pulse/q8',
      q9: '/flow/pulse/q9',
      q10: '/flow/pulse/q10',
      q11: '/flow/pulse/q11',
      q12: '/flow/pulse/q12',
      q13: '/flow/pulse/q13',
      q14: '/flow/pulse/q14',
      q15: '/flow/pulse/q15',
      q16: '/flow/pulse/q16',
      q17: '/flow/pulse/q17',
      q18: '/flow/pulse/q18',
      q19: '/flow/pulse/q19',
      result: '/flow/pulse/result',
    },
  },
} as const;

export const paths = {
  ...guestPaths,
  ...onboardingPaths,
  ...userPaths,
  ...flowPaths,
} as const;
