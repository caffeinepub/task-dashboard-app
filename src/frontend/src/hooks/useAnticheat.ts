import type { Principal } from "@icp-sdk/core/principal";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "./useActor";

const RAPID_ACTION_WINDOW_MS = 60_000; // 60 seconds
const RAPID_ACTION_LIMIT = 15; // max actions within window
const DEVTOOLS_DETECTION_DURATION_MS = 3_000; // 3 seconds open = freeze

/**
 * Anti-cheat hook — mounts on authenticated users and detects cheating.
 * On trigger: calls freezeAccountForCheat on backend and sets isFrozen=true.
 */
export function useAnticheat(
  principal: Principal | undefined,
  isAuthenticated: boolean,
) {
  const { actor } = useActor();
  const [isFrozen, setIsFrozen] = useState(false);
  const frozenRef = useRef(false);

  // Track rapid actions (shared counter used by global event bus)
  const actionTimestamps = useRef<number[]>([]);
  const devtoolsOpenSince = useRef<number | null>(null);
  const devtoolsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const consoleDetected = useRef(false);

  const triggerFreeze = useCallback(() => {
    if (frozenRef.current) return;
    frozenRef.current = true;
    setIsFrozen(true);

    // Fire freeze request — don't await, just trigger within 2s
    if (actor && principal) {
      const timeoutId = setTimeout(() => {
        actor.freezeAccountForCheat(principal).catch(() => {
          // Silently ignore if backend call fails — UI is already frozen
        });
      }, 100); // trigger quickly
      return () => clearTimeout(timeoutId);
    }
  }, [actor, principal]);

  // ── DevTools detection ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !principal || isFrozen) return;

    const checkDevTools = () => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const devtoolsOpen = widthDiff > 160 || heightDiff > 160;

      if (devtoolsOpen) {
        if (!devtoolsOpenSince.current) {
          devtoolsOpenSince.current = Date.now();
        } else if (
          Date.now() - devtoolsOpenSince.current >=
          DEVTOOLS_DETECTION_DURATION_MS
        ) {
          triggerFreeze();
        }
      } else {
        devtoolsOpenSince.current = null;
      }
    };

    devtoolsIntervalRef.current = setInterval(checkDevTools, 1000);
    return () => {
      if (devtoolsIntervalRef.current) {
        clearInterval(devtoolsIntervalRef.current);
      }
    };
  }, [isAuthenticated, principal, isFrozen, triggerFreeze]);

  // ── Console detection (soft signal — combine with another trigger) ────────
  useEffect(() => {
    if (!isAuthenticated || !principal || isFrozen) return;

    try {
      const check = /./;
      check.toString = () => {
        consoleDetected.current = true;
        return "check";
      };
      // biome-ignore lint/suspicious/noConsole: intentional console trap for cheat detection
      // biome-ignore lint/suspicious/useAwait: no await needed here
      void Promise.resolve().then(() => console.log(check));
    } catch {
      // Ignore if toString override fails
    }
  }, [isAuthenticated, principal, isFrozen]);

  // ── Rapid action detection ───────────────────────────────────────────────
  // Expose a global counter via window so other components can increment it
  useEffect(() => {
    if (!isAuthenticated || !principal || isFrozen) return;

    const checkRapidActions = () => {
      const now = Date.now();
      // Prune timestamps older than the window
      actionTimestamps.current = actionTimestamps.current.filter(
        (ts) => now - ts < RAPID_ACTION_WINDOW_MS,
      );

      if (actionTimestamps.current.length >= RAPID_ACTION_LIMIT) {
        // Combine with console detection for higher confidence
        triggerFreeze();
      }
    };

    // Override global rapid action tracker
    const globalKey = "__darkCoinActionTracker__";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[globalKey] = () => {
      actionTimestamps.current.push(Date.now());
      checkRapidActions();
    };

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any)[globalKey];
    };
  }, [isAuthenticated, principal, isFrozen, triggerFreeze]);

  return { isFrozen };
}

/**
 * Call this from mutation handlers to track rapid actions.
 * Works with the useAnticheat hook's global tracker.
 */
export function trackAction() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // biome-ignore lint/complexity/useLiteralKeys: dynamic key is intentional
  const tracker = (window as any)["__darkCoinActionTracker__"];
  if (typeof tracker === "function") {
    tracker();
  }
}
