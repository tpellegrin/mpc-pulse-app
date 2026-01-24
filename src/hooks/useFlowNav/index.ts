import { useLocation, useNavigate } from 'react-router-dom';

import { useNavigation } from 'globals/context/NavigationContext';
import { DURATION_MS, TransitionType } from 'containers/Layouts/common/LayoutTransitionContainer/types';
import { getAccessibleDuration } from 'utils/transitions/config';
import { FlowId, getNextStepPath, parseFlowFromPath } from 'flows/fromPaths';

/**
 * useFlowNav
 *
 * Helpers to navigate within flows while expressing the user's intent
 * for the next transition direction. Intent takes precedence over the
 * global baseline Fade.
 */
export const useFlowNav = () => {
  const { tryAcquireNavLock, setNextTransitionIntent } = useNavigation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Align lock to center transition duration plus a small finalize buffer
  const lockMs = getAccessibleDuration(DURATION_MS) + 120;

  /**
   * Advance to the next step in the flow.
   * If `to` is not provided, compute the next step from paths.ts order based on the current URL.
   * A new screen slides in from the right; content moves left.
   */
  const goNext = (to?: string) => {
    if (!tryAcquireNavLock(lockMs)) return;
    setNextTransitionIntent(TransitionType.ltr);

    let target = to;
    if (!target) {
      const { flowId, step } = parseFlowFromPath(pathname);
      if (flowId && step) {
        target = getNextStepPath(flowId as FlowId, step) ?? undefined;
      }
    }

    if (!target) return; // No next step (end of flow) → noop; caller can handle finish explicitly
    return navigate(target);
  };

  /**
   * Go back within the flow. If `to` is a number, it is passed directly
   * to react-router's Navigate (e.g., -1 to go back in history).
   * A new screen slides in from the left; content moves right.
   */
  const goBack = (to: string | number = -1) => {
    if (!tryAcquireNavLock(lockMs)) return;
    setNextTransitionIntent(TransitionType.rtl);
    // @ts-expect-error react-router supports numeric delta
    return navigate(to);
  };

  return { goNext, goBack };
};
