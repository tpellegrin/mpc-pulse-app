import { Navigate } from 'react-router-dom';

import { RouteType } from 'globals/types';
import { paths } from 'globals/paths';

import { SignIn } from './SignIn';
import { Welcome } from './Welcome';
import { Intro as CalcIntro } from '../flow/Pulse/Intro';
import { Savings as CalcSavings } from '../flow/Pulse/Savings';
import { MonthlySaving as CalcMonthlySaving } from '../flow/Pulse/MonthlySaving';
import { MaxInstallment as CalcMaxInstallment } from '../flow/Pulse/MaxInstallments';
import { SavingPeriod as CalcSavingPeriod } from '../flow/Pulse/SavingPeriod';
import { Result as CalcResult } from '../flow/Pulse/Result';

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
  // Calculator flow (components only; provider is applied at router parent)
  {
    path: paths.flow.calculator.intro,
    Component: CalcIntro,
  },
  {
    path: paths.flow.calculator.savings,
    Component: CalcSavings,
  },
  {
    path: paths.flow.calculator.monthlySaving,
    Component: CalcMonthlySaving,
  },
  {
    path: paths.flow.calculator.maxInstallment,
    Component: CalcMaxInstallment,
  },
  {
    path: paths.flow.calculator.savingPeriod,
    Component: CalcSavingPeriod,
  },
  {
    path: paths.flow.calculator.result,
    Component: CalcResult,
  },
];
