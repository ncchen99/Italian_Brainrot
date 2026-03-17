import { collection, doc, getDoc, getDocs, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, isFirebaseEnabled } from '../lib/firebase';

const COOLDOWN_CACHE_PREFIX = 'ibr-cooldown';
const CHALLENGE_DURATION_MS = 60 * 60 * 1000;
const LEGACY_COOLDOWN_PREFIX = 'level-cooldown:';
const SYNTHESIS_LEVEL_INGREDIENT_MAP = {
  level1: 'flour',
  level2: 'tomato',
  level3: 'water',
  level4: 'cheese',
  level5: 'basil'
};
const REQUIRED_SYNTHESIS_INGREDIENTS = Object.values(SYNTHESIS_LEVEL_INGREDIENT_MAP);

function getCooldownCacheKey(teamId, levelId) {
  return `${COOLDOWN_CACHE_PREFIX}:${teamId}:${levelId}`;
}

export function clearLocalChallengeCache() {
  const keys = Object.keys(window.localStorage);
  keys.forEach((key) => {
    if (key.startsWith(COOLDOWN_CACHE_PREFIX) || key.startsWith(LEGACY_COOLDOWN_PREFIX)) {
      window.localStorage.removeItem(key);
    }
  });
}

export async function saveLevelProgress({
  teamId,
  sessionId = null,
  levelId,
  status,
  payload = {}
}) {
  if (!teamId || !levelId) return;

  if (!isFirebaseEnabled || !db) return;

  const progressRef = sessionId
    ? doc(db, 'teams', teamId, 'challengeSessions', sessionId, 'progress', levelId)
    : doc(db, 'teams', teamId, 'progress', levelId);
  await setDoc(
    progressRef,
    {
      sessionId,
      levelId,
      status,
      updatedAt: serverTimestamp(),
      ...payload
    },
    { merge: true }
  );
}

export async function saveUploadRecord({
  teamId,
  levelId,
  imageUrl,
  objectKey
}) {
  if (!teamId || !imageUrl) return;

  if (!isFirebaseEnabled || !db) return;

  const uploadsRef = collection(db, 'teams', teamId, 'uploads');
  const uploadRef = doc(uploadsRef);
  await setDoc(uploadRef, {
    levelId,
    imageUrl,
    objectKey: objectKey || null,
    createdAt: serverTimestamp()
  });
}

export async function markRecentScan({
  teamId,
  route,
  code
}) {
  if (!teamId || !route) return;

  if (!isFirebaseEnabled || !db) return;

  const scanRef = doc(db, 'teams', teamId, 'scanAccess', route.replaceAll('/', '__'));
  await setDoc(
    scanRef,
    {
      route,
      code: code || '',
      grantedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function startChallengeSession({
  teamId,
  teamName = ''
}) {
  if (!teamId) return null;

  const startedAtMs = Date.now();
  const endsAtMs = startedAtMs + CHALLENGE_DURATION_MS;
  const sessionId = `${startedAtMs}`;

  if (!isFirebaseEnabled || !db) {
    return {
      id: sessionId,
      teamId,
      teamName,
      startedAtMs,
      endsAtMs,
      source: 'local'
    };
  }

  const sessionRef = doc(db, 'teams', teamId, 'challengeSessions', sessionId);
  await setDoc(
    sessionRef,
    {
      id: sessionId,
      teamId,
      teamName,
      startedAtMs,
      endsAtMs,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  const teamRef = doc(db, 'teams', teamId);
  await setDoc(
    teamRef,
    {
      activeSessionId: sessionId,
      activeSessionStartedAtMs: startedAtMs,
      activeSessionEndsAtMs: endsAtMs,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return {
    id: sessionId,
    teamId,
    teamName,
    startedAtMs,
    endsAtMs
  };
}

export async function getActiveChallengeSession({ teamId }) {
  if (!teamId) return null;

  if (!isFirebaseEnabled || !db) return null;

  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) return null;

  const teamData = teamSnap.data() || {};
  const sessionId = teamData.activeSessionId;
  const startedAtMs = Number(teamData.activeSessionStartedAtMs);
  const endsAtMs = Number(teamData.activeSessionEndsAtMs);

  if (!sessionId || !Number.isFinite(startedAtMs) || !Number.isFinite(endsAtMs)) {
    return null;
  }

  return {
    id: sessionId,
    teamId,
    startedAtMs,
    endsAtMs
  };
}

export async function getSessionProgress({ teamId, sessionId }) {
  if (!teamId || !sessionId) return {};
  if (!isFirebaseEnabled || !db) return {};

  const progressCol = collection(db, 'teams', teamId, 'challengeSessions', sessionId, 'progress');
  const snapshot = await getDocs(progressCol);
  const progressMap = {};

  snapshot.forEach((item) => {
    const data = item.data() || {};
    progressMap[item.id] = data;
  });

  return progressMap;
}

export function subscribeSessionProgress({
  teamId,
  sessionId,
  onChange,
  onError
}) {
  if (!teamId || !sessionId || typeof onChange !== 'function') {
    return () => {};
  }

  if (!isFirebaseEnabled || !db) {
    onChange({});
    return () => {};
  }

  const progressCol = collection(db, 'teams', teamId, 'challengeSessions', sessionId, 'progress');
  const unsubscribe = onSnapshot(
    progressCol,
    (snapshot) => {
      const progressMap = {};
      snapshot.forEach((item) => {
        progressMap[item.id] = item.data() || {};
      });
      onChange(progressMap);
    },
    (error) => {
      if (typeof onError === 'function') {
        onError(error);
      }
    }
  );

  return unsubscribe;
}

export async function setLevelCooldown({
  teamId,
  sessionId = null,
  levelId,
  cooldownUntil
}) {
  if (!teamId || !levelId || !cooldownUntil) return;

  const cacheLevelId = sessionId ? `${sessionId}:${levelId}` : levelId;
  window.localStorage.setItem(getCooldownCacheKey(teamId, cacheLevelId), String(cooldownUntil));

  if (!isFirebaseEnabled || !db) return;

  const cooldownRef = sessionId
    ? doc(db, 'teams', teamId, 'challengeSessions', sessionId, 'cooldowns', levelId)
    : doc(db, 'teams', teamId, 'cooldowns', levelId);
  await setDoc(
    cooldownRef,
    {
      sessionId,
      cooldownUntil,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function getLevelCooldown({ teamId, sessionId = null, levelId }) {
  if (!teamId || !levelId) return null;

  const cacheLevelId = sessionId ? `${sessionId}:${levelId}` : levelId;
  const localValue = window.localStorage.getItem(getCooldownCacheKey(teamId, cacheLevelId));
  if (localValue) {
    const parsed = Number(localValue);
    if (Number.isFinite(parsed) && parsed > Date.now()) {
      return parsed;
    }
  }

  if (!isFirebaseEnabled || !db) return null;

  const cooldownRef = sessionId
    ? doc(db, 'teams', teamId, 'challengeSessions', sessionId, 'cooldowns', levelId)
    : doc(db, 'teams', teamId, 'cooldowns', levelId);
  const snap = await getDoc(cooldownRef);
  if (!snap.exists()) return null;

  const value = Number(snap.data()?.cooldownUntil);
  if (!Number.isFinite(value)) return null;
  if (value <= Date.now()) return null;

  window.localStorage.setItem(getCooldownCacheKey(teamId, cacheLevelId), String(value));
  return value;
}

function toIngredientSet(progressMap) {
  const set = new Set();
  Object.entries(SYNTHESIS_LEVEL_INGREDIENT_MAP).forEach(([levelId, ingredientId]) => {
    if (progressMap?.[levelId]?.status === 'completed') {
      set.add(ingredientId);
    }
  });
  return set;
}

function pickRandomItem(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export async function getSynthesisSupportPlan({ teamId, sessionId }) {
  if (!teamId || !sessionId) {
    return {
      myIngredients: [],
      missingIngredients: REQUIRED_SYNTHESIS_INGREDIENTS,
      complementaryTeams: [],
      rescueTeam: null,
      globalMissingIngredients: REQUIRED_SYNTHESIS_INGREDIENTS
    };
  }

  const myProgress = await getSessionProgress({ teamId, sessionId });
  const myIngredientSet = toIngredientSet(myProgress);
  const missingIngredients = REQUIRED_SYNTHESIS_INGREDIENTS.filter((id) => !myIngredientSet.has(id));

  if (!isFirebaseEnabled || !db || missingIngredients.length === 0) {
    return {
      myIngredients: Array.from(myIngredientSet),
      missingIngredients,
      complementaryTeams: [],
      rescueTeam: null,
      globalMissingIngredients: []
    };
  }

  const teamsSnap = await getDocs(collection(db, 'teams'));
  const candidates = [];

  await Promise.all(
    teamsSnap.docs.map(async (teamDoc) => {
      if (teamDoc.id === teamId) return;

      const teamData = teamDoc.data() || {};
      const candidateSessionId = teamData.activeSessionId;
      if (!candidateSessionId) return;

      const progress = await getSessionProgress({
        teamId: teamDoc.id,
        sessionId: candidateSessionId
      }).catch(() => ({}));
      const ingredientSet = toIngredientSet(progress);
      const provides = missingIngredients.filter((id) => ingredientSet.has(id));
      const completedCount = ingredientSet.size;

      candidates.push({
        teamId: teamDoc.id,
        teamName: teamData.name || '',
        ingredientSet,
        provides,
        completedCount
      });
    })
  );

  const complementaryTeams = candidates
    .filter((team) => team.provides.length > 0)
    .sort((a, b) => b.provides.length - a.provides.length);

  const rescuePool = candidates.filter((team) => team.completedCount === REQUIRED_SYNTHESIS_INGREDIENTS.length);
  const rescueTeam = complementaryTeams.length === 0 ? pickRandomItem(rescuePool) : null;

  const ingredientSeenCount = missingIngredients.reduce((acc, ingredientId) => {
    acc[ingredientId] = 0;
    return acc;
  }, {});
  complementaryTeams.forEach((team) => {
    team.provides.forEach((ingredientId) => {
      ingredientSeenCount[ingredientId] = (ingredientSeenCount[ingredientId] || 0) + 1;
    });
  });

  const globalMissingIngredients = missingIngredients.filter((ingredientId) => (ingredientSeenCount[ingredientId] || 0) === 0);

  return {
    myIngredients: Array.from(myIngredientSet),
    missingIngredients,
    complementaryTeams: complementaryTeams.map((team) => ({
      teamId: team.teamId,
      teamName: team.teamName,
      provides: team.provides
    })),
    rescueTeam: rescueTeam
      ? {
          teamId: rescueTeam.teamId,
          teamName: rescueTeam.teamName,
          provides: rescueTeam.provides
        }
      : null,
    globalMissingIngredients
  };
}
