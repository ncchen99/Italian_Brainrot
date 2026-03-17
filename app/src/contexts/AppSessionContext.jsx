/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ensureAnonymousAuth,
  getStoredTeamName,
  subscribeAuthState,
  upsertTeamProfile
} from '../services/authService';
import { clearScanAccess } from '../services/scanAccessService';
import { clearLocalChallengeCache, getActiveChallengeSession, startChallengeSession } from '../services/progressService';

const AppSessionContext = createContext(null);

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

    getActiveChallengeSession({ teamId: user.uid })
      .then((session) => {
        if (!alive) return;
        setActiveChallenge(session);
      })
      .catch(() => {
        if (!alive) return;
        setActiveChallenge(null);
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
    setUser(authUser);
    setTeamName(profile.teamName);
    setActiveChallenge(session);
    return profile;
  };

  const value = useMemo(() => ({
    user,
    teamId: user?.uid || null,
    teamName,
    activeChallenge,
    setTeamName,
    loading,
    bindTeamProfile
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
