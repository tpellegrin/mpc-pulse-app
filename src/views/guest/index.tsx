import { Navigate } from 'react-router-dom';

import { RouteType } from 'globals/types';
import { paths } from 'globals/paths';

import { SignIn } from './SignIn';
import { Welcome } from './Welcome';
import { Intro as PulseIntro } from '../flow/Pulse/Intro';
import { Savings as PulseSavings } from '../flow/pulse/Q2';
import { MonthlySaving as PulseMonthlySaving } from '../flow/Pulse/MonthlySaving';
import { MaxInstallment as PulseMaxInstallment } from '../flow/Pulse/MaxInstallments';
import { SavingPeriod as PulseSavingPeriod } from '../flow/Pulse/SavingPeriod';
import { Result as PulseResult } from '../flow/Pulse/Result';

export const GuestRoutes: RouteType[] = [
  {
    path: paths.index,
    element: <Navigate to={paths.welcome} replace />,
  },
  {
    path: paths.signIn,
    Component: SignIn,
  },
  {
    path: paths.welcome,
    Component: Welcome,
  },
  // Pulse flow
  {
    path: paths.flow.pulse.intro,
    Component: PulseIntro,
  },
  {
    path: paths.flow.pulse.savings,
    Component: PulseSavings,
  },
  {
    path: paths.flow.pulse.monthlySaving,
    Component: PulseMonthlySaving,
  },
  {
    path: paths.flow.pulse.maxInstallment,
    Component: PulseMaxInstallment,
  },
  {
    path: paths.flow.pulse.savingPeriod,
    Component: PulseSavingPeriod,
  },
  {
    path: paths.flow.pulse.result,
    Component: PulseResult,
  },
];
