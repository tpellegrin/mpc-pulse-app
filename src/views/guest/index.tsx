import { Navigate } from 'react-router-dom';

import { RouteType } from 'globals/types';
import { paths } from 'globals/paths';

import { SignIn } from './SignIn';
import { Welcome } from './Welcome';
import { Intro as PulseIntro } from '../flow/pulse/Intro';
import { Q2 as PulseQ2 } from '../flow/pulse/Q2';
import { PulseQuestion } from '../flow/pulse/_shared/PulseQuestion';
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
    path: paths.flow.pulse.q2,
    Component: PulseQ2,
  },
  {
    path: paths.flow.pulse.q3,
    element: <PulseQuestion tag="q3" picturesFolder="mongrau" />,
  },
  {
    path: paths.flow.pulse.q4,
    element: <PulseQuestion tag="q4" picturesFolder="abraao" />,
  },
  {
    path: paths.flow.pulse.q5,
    element: <PulseQuestion tag="q5" picturesFolder="nane" />,
  },
  {
    path: paths.flow.pulse.q6,
    element: <PulseQuestion tag="q6" picturesFolder="hernandes" />,
  },
  {
    path: paths.flow.pulse.q7,
    element: <PulseQuestion tag="q7" picturesFolder="raquel" />,
  },
  {
    path: paths.flow.pulse.q8,
    element: <PulseQuestion tag="q8" picturesFolder="debora" />,
  },
  {
    path: paths.flow.pulse.q9,
    element: <PulseQuestion tag="q9" picturesFolder="marcelo" />,
  },
  {
    path: paths.flow.pulse.q10,
    element: <PulseQuestion tag="q10" picturesFolder="marcia" />,
  },
  {
    path: paths.flow.pulse.q11,
    element: <PulseQuestion tag="q11" picturesFolder="mongrau" />,
  },
  {
    path: paths.flow.pulse.q12,
    element: <PulseQuestion tag="q12" picturesFolder="abraao" />,
  },
  {
    path: paths.flow.pulse.q13,
    element: <PulseQuestion tag="q13" picturesFolder="nane" />,
  },
  {
    path: paths.flow.pulse.q14,
    element: <PulseQuestion tag="q14" picturesFolder="hernandes" />,
  },
  {
    path: paths.flow.pulse.q15,
    element: <PulseQuestion tag="q15" picturesFolder="raquel" />,
  },
  {
    path: paths.flow.pulse.q16,
    element: <PulseQuestion tag="q16" picturesFolder="debora" />,
  },
  {
    path: paths.flow.pulse.q17,
    element: <PulseQuestion tag="q17" picturesFolder="marcelo" />,
  },
  {
    path: paths.flow.pulse.q18,
    element: <PulseQuestion tag="q18" picturesFolder="marcia" />,
  },
  {
    path: paths.flow.pulse.q19,
    element: <PulseQuestion tag="q19" picturesFolder="mongrau" />,
  },
  {
    path: paths.flow.pulse.result,
    Component: PulseResult,
  },
];
