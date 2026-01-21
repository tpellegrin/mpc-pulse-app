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
    calculator: {
      intro: '/flow/calculator/intro',
      savings: '/flow/calculator/savings',
      monthlySaving: '/flow/calculator/monthly-saving',
      savingPeriod: '/flow/calculator/saving-period',
      maxInstallment: '/flow/calculator/max-installment',
      result: '/flow/calculator/result',
    },
  },
} as const;

export const paths = {
  ...guestPaths,
  ...onboardingPaths,
  ...userPaths,
  ...flowPaths,
} as const;
