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
import { DURATION_MS, TransitionType } from 'containers/Layouts/common/LayoutTransitionContainer/types';
import { getAccessibleDuration } from 'utils/transitions/config';

type NavigationContextProps = {
  routerType: RouterType;
  setRouterType: (type: RouterType) => void;
  transition: TransitionType | null;
  setTransition: (t: TransitionType | null) => void;
  scrollRef: React.RefObject<HTMLElement | null>;
  // One-shot pending transition to reflect user intent on the next navigation
  nextTransitionRef: React.MutableRefObject<TransitionType | null>;
  setNextTransitionIntent: (t: TransitionType | null) => void;
  // Navigation rate limiting
  isNavBlocked: boolean;
  blockNavigation: (ms: number) => void;
  tryAcquireNavLock: (ms?: number) => boolean;
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
  isNavBlocked: false,
  blockNavigation: () => {},
  tryAcquireNavLock: () => true,
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

  // Navigation rate limiter state
  const navBlockedUntilRef = useRef(0);
  const [navBlockTick, setNavBlockTick] = useState(0);
  const isNavBlocked = Date.now() < navBlockedUntilRef.current;

  const forceUpdateAfter = (ms: number) => {
    if (ms <= 0) return;
    window.setTimeout(() => setNavBlockTick((n) => n + 1), ms + 1);
  };

  const defaultLockMs = getAccessibleDuration(DURATION_MS) + 120;

  const blockNavigation = (ms: number) => {
    const until = Date.now() + Math.max(0, ms);
    if (until > navBlockedUntilRef.current) {
      navBlockedUntilRef.current = until;
      forceUpdateAfter(until - Date.now());
      // also tick now to propagate disabled state immediately
      setNavBlockTick((n) => n + 1);
    }
  };

  const tryAcquireNavLock = (ms: number = defaultLockMs) => {
    const now = Date.now();
    if (now < navBlockedUntilRef.current) return false;
    navBlockedUntilRef.current = now + Math.max(0, ms);
    // propagate to consumers and schedule unblock tick
    setNavBlockTick((n) => n + 1);
    forceUpdateAfter(ms);
    return true;
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
      isNavBlocked,
      blockNavigation,
      tryAcquireNavLock,
    }),
    [routerType, transition, navBlockTick],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
