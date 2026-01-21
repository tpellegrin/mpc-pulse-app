import React, {
  createContext,
  FC,
  ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import { RouterType } from 'globals/types';
import { TransitionType } from 'containers/Layouts/common/LayoutTransitionContainer/types';

type NavigationContextProps = {
  routerType: RouterType;
  setRouterType: (type: RouterType) => void;
  transition: TransitionType | null;
  setTransition: (t: TransitionType | null) => void;
  scrollRef: React.RefObject<HTMLElement | null>;
  // One-shot pending transition to reflect user intent on the next navigation
  nextTransitionRef: React.MutableRefObject<TransitionType | null>;
  setNextTransitionIntent: (t: TransitionType | null) => void;
};

const NavigationContext = createContext<NavigationContextProps>({
  routerType: RouterType.guest,
  setRouterType: () => {},
  transition: null,
  setTransition: () => {},
  scrollRef: { current: null } as React.RefObject<HTMLElement | null>,
  nextTransitionRef: {
    current: null,
  } as React.MutableRefObject<TransitionType | null>,
  setNextTransitionIntent: () => {},
});

export const NavigationProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [routerType, setRouterType] = useState<RouterType>(RouterType.guest);
  const [transition, setTransition] = useState<TransitionType | null>(null);
  const scrollRef = useRef<HTMLElement>(null);
  const nextTransitionRef = useRef<TransitionType | null>(null);
  const setNextTransitionIntent = (t: TransitionType | null) => {
    nextTransitionRef.current = t;
  };

  const value = useMemo(
    () => ({
      routerType,
      setRouterType,
      transition,
      setTransition,
      scrollRef,
      nextTransitionRef,
      setNextTransitionIntent,
    }),
    [routerType, transition],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
