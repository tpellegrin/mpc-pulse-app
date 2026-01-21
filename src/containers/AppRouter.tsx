import { useEffect, useMemo } from 'react';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import { useNavigation } from 'globals/context/NavigationContext';
import { RouterType, RouteType } from 'globals/types';
import { GuestRoutes } from 'views/guest';
import { OnboardingRoutes } from 'views/onboarding';
import { UserRoutes } from 'views/user';
import { ErrorPage } from 'views/ErrorPage';
import { CenterTransitionShell } from 'containers/Layouts/Shells/CenterTransitionShell';
import { AnimatedOutlet } from 'components/AnimatedOutlet';
import { CalculatorProviderOutlet } from '../views/flow/Pulse/state/ProviderOutlet';

/**
 * Creates a router configuration for the given routes
 * - Non-flow routes: wrapped by AnimatedOutlet (fade-only route transitions)
 * - Flow routes (a path starts with "/flow/"): wrapped by CenterTransitionShell (center-only LTR/RTL)
 */
const getRouter = (routes: RouteType[]) => {
  const flowRoutes = routes.filter((r) => r.path?.startsWith('/flow/'));
  const nonFlowRoutes = routes.filter((r) => !r.path?.startsWith('/flow/'));

  // Map non-flow routes as children (can use absolute paths)
  const nonFlowChildren = nonFlowRoutes.map((route) => ({
    index: route.path === '/',
    path: route.path === '/' ? undefined : route.path,
    Component: route.Component,
    element: route.element,
    errorElement: <ErrorPage />,
  }));

  // Split flow routes into calculator and other flows
  const calculatorRoutes = flowRoutes.filter((r) =>
    r.path?.startsWith('/flow/calculator/'),
  );
  const otherFlowRoutes = flowRoutes.filter(
    (r) => !r.path?.startsWith('/flow/calculator/'),
  );

  // Map calculator children under a provider-wrapped parent
  const calculatorChildren = calculatorRoutes.map((route) => {
    const relative = route.path.replace(/^\/(?:flow)\/(?:calculator)\/?/, '');
    return {
      path: relative,
      Component: route.Component,
      element: route.element,
      errorElement: <ErrorPage />,
    };
  });

  // Map other flow routes directly under /flow
  const otherFlowChildren = otherFlowRoutes.map((route) => {
    const relative = route.path.replace(/^\/(?:flow)\/?/, '');
    return {
      path: relative,
      Component: route.Component,
      element: route.element,
      errorElement: <ErrorPage />,
    };
  });

  return createHashRouter([
    {
      path: '/',
      element: <AnimatedOutlet />,
      errorElement: <ErrorPage />,
      children: [
        ...nonFlowChildren,
        {
          path: 'flow',
          element: <CenterTransitionShell />,
          errorElement: <ErrorPage />,
          children: [
            {
              path: 'calculator',
              element: <CalculatorProviderOutlet />,
              errorElement: <ErrorPage />,
              children: calculatorChildren,
            },
            ...otherFlowChildren,
          ],
        },
        { path: '*', element: <ErrorPage /> },
      ],
    },
  ]);
};

/**
 * AppRouter component that handles router switching based on the current router type
 */
export const AppRouter = () => {
  const { routerType, setRouterType } = useNavigation();

  // Create the appropriate router based on the current router type
  const router = useMemo(() => {
    switch (routerType) {
      case RouterType.guest:
        return getRouter(GuestRoutes);
      case RouterType.onboarding:
        return getRouter(OnboardingRoutes);
      case RouterType.user:
        return getRouter(UserRoutes);
    }
  }, [routerType]);

  // Set initial router type on mount
  useEffect(() => {
    setRouterType(RouterType.guest);
  }, [setRouterType]);

  return <RouterProvider router={router} />;
};
