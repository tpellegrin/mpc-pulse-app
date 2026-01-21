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
      savings: '/flow/pulse/savings',
      monthlySaving: '/flow/pulse/monthly-saving',
      savingPeriod: '/flow/pulse/saving-period',
      maxInstallment: '/flow/pulse/max-installment',
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
