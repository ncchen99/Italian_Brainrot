/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearStoredAuthState,
  ensureAnonymousAuth,
  getStoredTeamName,
  subscribeAuthState,
  upsertTeamProfile
} from '../services/authService';
import { clearScanAccess } from '../services/scanAccessService';
import { clearLocalChallengeCache, getActiveChallengeSession, startChallengeSession } from '../services/progressService';

const AppSessionContext = createContext(null);
const ACTIVE_CHALLENGE_CACHE_PREFIX = 'ibr-active-challenge';

function getActiveChallengeCacheKey(teamId) {
  return `${ACTIVE_CHALLENGE_CACHE_PREFIX}:${teamId}`;
}

function readCachedActiveChallenge(teamId) {
  if (!teamId) return null;
  try {
    const raw = window.localStorage.getItem(getActiveChallengeCacheKey(teamId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const endsAtMs = Number(parsed?.endsAtMs);
    const startedAtMs = Number(parsed?.startedAtMs);
    if (!parsed?.id || !Number.isFinite(endsAtMs) || !Number.isFinite(startedAtMs)) {
      return null;
    }
    if (endsAtMs <= Date.now()) return null;
    return {
      id: String(parsed.id),
      teamId,
      startedAtMs,
      endsAtMs
    };
  } catch {
    return null;
  }
}

function writeCachedActiveChallenge(teamId, session) {
  if (!teamId || !session?.id) return;
  const endsAtMs = Number(session.endsAtMs);
  const startedAtMs = Number(session.startedAtMs);
  if (!Number.isFinite(endsAtMs) || !Number.isFinite(startedAtMs)) return;
  if (endsAtMs <= Date.now()) return;

  window.localStorage.setItem(
    getActiveChallengeCacheKey(teamId),
    JSON.stringify({
      id: String(session.id),
      startedAtMs,
      endsAtMs
    })
  );
}

function clearCachedActiveChallenge(teamId) {
  if (!teamId) return;
  window.localStorage.removeItem(getActiveChallengeCacheKey(teamId));
}

export function AppSessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [teamName, setTeamName] = useState(getStoredTeamName());
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAuthState((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let alive = true;
    if (!user?.uid) {
      setActiveChallenge(null);
      return () => {
        alive = false;
      };
    }

    const cached = readCachedActiveChallenge(user.uid);
    if (cached) {
      setActiveChallenge(cached);
    }

    getActiveChallengeSession({ teamId: user.uid })
      .then((session) => {
        if (!alive) return;
        const isValid = Boolean(session?.id && Number(session?.endsAtMs) > Date.now());
        if (isValid) {
          setActiveChallenge(session);
          writeCachedActiveChallenge(user.uid, session);
          return;
        }
        setActiveChallenge(null);
        clearCachedActiveChallenge(user.uid);
      })
      .catch(() => {
        if (!alive) return;
        if (!cached) {
          setActiveChallenge(null);
        }
      });

    return () => {
      alive = false;
    };
  }, [user?.uid]);

  const bindTeamProfile = async (inputTeamName) => {
    const authUser = await ensureAnonymousAuth();
    const profile = await upsertTeamProfile({
      uid: authUser.uid,
      teamName: inputTeamName
    });
    const existingSession = await getActiveChallengeSession({ teamId: authUser.uid }).catch(() => null);
    const hasActiveSession = Boolean(existingSession?.id && Number(existingSession?.endsAtMs) > Date.now());

    if (!hasActiveSession) {
      clearScanAccess();
      clearLocalChallengeCache();
    }

    const session = hasActiveSession
      ? existingSession
      : await startChallengeSession({
          teamId: authUser.uid,
          teamName: profile.teamName
        });
    if (session?.id && Number(session?.endsAtMs) > Date.now()) {
      writeCachedActiveChallenge(authUser.uid, session);
    } else {
      clearCachedActiveChallenge(authUser.uid);
    }
    setUser(authUser);
    setTeamName(profile.teamName);
    setActiveChallenge(session);
    return profile;
  };

  const clearSessionState = () => {
    clearStoredAuthState();
    clearScanAccess();
    clearLocalChallengeCache();
    if (user?.uid) {
      clearCachedActiveChallenge(user.uid);
    }
    setUser(null);
    setTeamName('');
    setActiveChallenge(null);
  };

  const value = useMemo(() => ({
    user,
    teamId: user?.uid || null,
    teamName,
    activeChallenge,
    setTeamName,
    loading,
    bindTeamProfile,
    clearSessionState
  }), [user, teamName, activeChallenge, loading]);

  return (
    <AppSessionContext.Provider value={value}>
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession() {
  const context = useContext(AppSessionContext);
  if (!context) {
    throw new Error('useAppSession must be used within AppSessionProvider');
  }
  return context;
}
