import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';
import { auth, db, isFirebaseEnabled } from '../lib/firebase';
import { clearStoredAuthState } from './authService';
import { clearLocalChallengeCache } from './progressService';
import { clearScanAccess } from './scanAccessService';

const ACTIVE_CHALLENGE_CACHE_PREFIX = 'ibr-active-challenge';

function clearActiveChallengeCache() {
  const keys = Object.keys(window.localStorage);
  keys.forEach((key) => {
    if (key.startsWith(ACTIVE_CHALLENGE_CACHE_PREFIX)) {
      window.localStorage.removeItem(key);
    }
  });
}

async function deleteCollectionDocs(pathSegments) {
  if (!isFirebaseEnabled || !db) return;
  const colRef = collection(db, ...pathSegments);
  const snapshot = await getDocs(colRef);
  await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
}

async function deleteChallengeSessions(teamId) {
  if (!isFirebaseEnabled || !db || !teamId) return;
  const sessionsRef = collection(db, 'teams', teamId, 'challengeSessions');
  const sessionsSnapshot = await getDocs(sessionsRef);

  for (const sessionDoc of sessionsSnapshot.docs) {
    const sessionId = sessionDoc.id;
    await deleteCollectionDocs(['teams', teamId, 'challengeSessions', sessionId, 'progress']);
    await deleteCollectionDocs(['teams', teamId, 'challengeSessions', sessionId, 'cooldowns']);
    await deleteDoc(sessionDoc.ref);
  }
}

export async function wipeCurrentTeamData({ teamId }) {
  clearScanAccess();
  clearLocalChallengeCache();
  clearActiveChallengeCache();
  clearStoredAuthState();
  window.sessionStorage.clear();

  if (!teamId || !isFirebaseEnabled || !db) {
    return;
  }

  await deleteCollectionDocs(['teams', teamId, 'progress']);
  await deleteCollectionDocs(['teams', teamId, 'uploads']);
  await deleteCollectionDocs(['teams', teamId, 'scanAccess']);
  await deleteCollectionDocs(['teams', teamId, 'cooldowns']);
  await deleteChallengeSessions(teamId);
  await deleteDoc(doc(db, 'teams', teamId));
}

export async function removeCurrentAuthUser() {
  if (!isFirebaseEnabled || !auth) {
    return;
  }

  const current = auth.currentUser;
  if (!current) return;

  try {
    await deleteUser(current);
  } catch {
    await signOut(auth);
  }
}
