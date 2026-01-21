import { useEffect } from 'react';

import { useRouterSwitcher } from 'globals/context/RouterSwitcher';
import { RouterType } from 'globals/context/RouterSwitcher/types';
import { AnimatedOutlet } from 'components/AnimatedOutlet';

export const Router = () => {
  const { setRouterType } = useRouterSwitcher();

  useEffect(() => {
    void setRouterType(RouterType.guest);
  }, [setRouterType]);

  return <AnimatedOutlet />;
};
