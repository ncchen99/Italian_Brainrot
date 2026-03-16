import { useCallback, useEffect, useMemo, useState } from 'react';

const COOLDOWN_DURATION_MS = 5 * 60 * 1000;

function getStorageKey(levelId) {
  return `level-cooldown:${levelId}`;
}

function readStoredExpiry(levelId) {
  const raw = window.localStorage.getItem(getStorageKey(levelId));
  if (!raw) return null;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    window.localStorage.removeItem(getStorageKey(levelId));
    return null;
  }

  return parsed;
}

export function formatCooldownTime(remainingMs) {
  const safeMs = Math.max(0, remainingMs);
  const totalSeconds = Math.ceil(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function useLevelCooldown(levelId, durationMs = COOLDOWN_DURATION_MS) {
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const stored = readStoredExpiry(levelId);
    const current = Date.now();

    if (stored && stored > current) {
      setCooldownUntil(stored);
    } else if (stored) {
      window.localStorage.removeItem(getStorageKey(levelId));
    }
  }, [levelId]);

  useEffect(() => {
    if (!cooldownUntil) return undefined;

    const intervalId = window.setInterval(() => {
      const current = Date.now();
      setNow(current);

      if (current >= cooldownUntil) {
        window.localStorage.removeItem(getStorageKey(levelId));
        setCooldownUntil(null);
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [cooldownUntil, levelId]);

  const triggerCooldown = useCallback(() => {
    const expiry = Date.now() + durationMs;
    window.localStorage.setItem(getStorageKey(levelId), String(expiry));
    setCooldownUntil(expiry);
    setNow(Date.now());
  }, [durationMs, levelId]);

  const remainingMs = useMemo(() => {
    if (!cooldownUntil) return 0;
    return Math.max(0, cooldownUntil - now);
  }, [cooldownUntil, now]);

  return {
    isCoolingDown: remainingMs > 0,
    remainingMs,
    triggerCooldown
  };
}
