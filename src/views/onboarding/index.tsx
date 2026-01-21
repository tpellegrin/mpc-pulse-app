import { RouteType } from 'globals/types';
import { paths } from 'globals/paths';

import { Welcome } from './Welcome';

export const OnboardingRoutes: RouteType[] = [
  {
    path: paths.onboarding.welcome,
    Component: Welcome,
  },
];
