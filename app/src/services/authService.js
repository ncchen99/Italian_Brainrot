import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseEnabled } from '../lib/firebase';

const LOCAL_AUTH_KEY = 'ibr-local-anon-uid';
const TEAM_NAME_KEY = 'ibr-team-name';
const AUTH_READY_TIMEOUT_MS = 5000;

function getOrCreateLocalUid() {
  const existing = window.localStorage.getItem(LOCAL_AUTH_KEY);
  if (existing) return existing;
  const uid = `local-${crypto.randomUUID()}`;
  window.localStorage.setItem(LOCAL_AUTH_KEY, uid);
  return uid;
}

export function getStoredTeamName() {
  return window.localStorage.getItem(TEAM_NAME_KEY) || '';
}

export function setStoredTeamName(teamName) {
  window.localStorage.setItem(TEAM_NAME_KEY, teamName.trim());
}

export function subscribeAuthState(callback) {
  if (!isFirebaseEnabled || !auth) {
    const uid = getOrCreateLocalUid();
    callback({
      uid,
      isLocalFallback: true
    });
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    callback(user || null);
  });
}

async function waitForAuthReady(timeoutMs = AUTH_READY_TIMEOUT_MS) {
  if (!isFirebaseEnabled || !auth) return null;
  if (auth.currentUser) return auth.currentUser;

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      unsubscribe();
      reject(new Error('等待 Firebase 匿名登入狀態逾時'));
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      window.clearTimeout(timer);
      unsubscribe();
      resolve(user);
    });
  });
}

export async function ensureAnonymousAuth() {
  if (!isFirebaseEnabled || !auth) {
    return {
      uid: getOrCreateLocalUid(),
      isLocalFallback: true
    };
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  const credential = await signInAnonymously(auth);
  // Ensure ID token is materialized before Firestore/Storage access.
  await credential.user.getIdToken();

  try {
    return await waitForAuthReady();
  } catch {
    return credential.user;
  }
}

export async function upsertTeamProfile({ uid, teamName }) {
  const safeTeamName = teamName.trim();
  setStoredTeamName(safeTeamName);

  if (!isFirebaseEnabled || !db) {
    return {
      teamId: uid,
      teamName: safeTeamName,
      isLocalFallback: true
    };
  }

  const authUser = await waitForAuthReady().catch(() => auth?.currentUser || null);
  const effectiveUid = authUser?.uid || uid;
  const teamRef = doc(db, 'teams', effectiveUid);

  try {
    await setDoc(
      teamRef,
      {
        name: safeTeamName,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    console.error('[firebase] upsertTeamProfile failed', {
      code: error?.code,
      message: error?.message,
      uid: effectiveUid,
      authedUid: authUser?.uid || null,
      projectId: db?.app?.options?.projectId || null
    });
    throw error;
  }

  return {
    teamId: effectiveUid,
    teamName: safeTeamName
  };
}
