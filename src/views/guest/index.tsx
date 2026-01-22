import { Navigate } from 'react-router-dom';

import { RouteType } from 'globals/types';
import { paths } from 'globals/paths';

import { SignIn } from './SignIn';
import { Welcome } from './Welcome';
import { Intro as PulseIntro } from '../flow/pulse/Intro';
import { Q2 as PulseQ2 } from '../flow/pulse/Q2';
import { MonthlySaving as PulseMonthlySaving } from '../flow/pulse/MonthlySaving';
import { MaxInstallment as PulseMaxInstallment } from '../flow/pulse/MaxInstallments';
import { SavingPeriod as PulseSavingPeriod } from '../flow/pulse/SavingPeriod';
import { Result as PulseResult } from '../flow/pulse/Result';

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
    Component: PulseQ2,
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
