import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router';
import { useNavigation } from 'globals/context/NavigationContext';
import { paths } from 'globals/paths';

const POSITION_TTL_MS = 1000 * 60 * 60; // 1 hour

// Routes that should preserve scroll position
const LOCATIONS_TO_PERSIST: string[] = [
  paths.index,
  // Add other paths as needed
];

type ScrollPosition = {
  left: number;
  top: number;
  timestamp: number;
};

// Store scroll positions in memory
const SCROLL_POSITIONS: Record<string, ScrollPosition> = {};

/**
 * Hook for managing scroll positions across route changes
 * Provides methods for saving, restoring, and resetting scroll positions
 */
export const useScrollManagement = () => {
  const { scrollRef } = useNavigation();
  const location = useLocation();

  // Save scroll position when navigating away from persistent routes
  useEffect(() => {
    return () => {
      if (
        !scrollRef.current ||
        !LOCATIONS_TO_PERSIST.includes(location.pathname)
      )
        return;

      SCROLL_POSITIONS[location.pathname] = {
        left: scrollRef.current.scrollLeft,
        top: scrollRef.current.scrollTop,
        timestamp: Date.now(),
      };
    };
  }, [scrollRef, location.pathname]);

  // Restore scroll position for a specific path
  const restoreScrollPosition = useCallback(
    (pathname: string) => {
      const position = SCROLL_POSITIONS[pathname];
      if (!position || !scrollRef.current) return;

      const isWithinTTL = Date.now() - position.timestamp < POSITION_TTL_MS;
      if (isWithinTTL) {
        scrollRef.current.scrollTo({
          left: position.left,
          top: position.top,
          behavior: 'instant',
        });
      }
    },
    [scrollRef],
  );

  // Reset scroll to top
  const scrollToTop = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: 0,
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [scrollRef]);

  return {
    scrollRef,
    restoreScrollPosition,
    scrollToTop,
    shouldPersistScroll: LOCATIONS_TO_PERSIST.includes(location.pathname),
  };
};
