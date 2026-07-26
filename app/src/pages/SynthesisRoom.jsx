import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { ingredientImages, uiImages } from '../assets';
import { useAppSession } from '../contexts/AppSessionContext';
import {
  getSynthesisSupportPlan,
  createSynthesisStation,
  joinSynthesisStation,
  updateSynthesisPlaced,
  setSynthesisReady,
  subscribeSynthesisStation,
  saveLevelProgress
} from '../services/progressService';
import { useTranslation, Trans } from 'react-i18next';

const INGREDIENT_META = [
  { id: 'flour', imageSrc: ingredientImages.premiumFlour, labelKey: 'dashboard.ingredients.i1_title', color: '#FBBF24' },
  { id: 'water', imageSrc: ingredientImages.pureSpringWater, labelKey: 'dashboard.ingredients.i3_title', color: '#38BDF8' },
  { id: 'tomato', imageSrc: ingredientImages.holyTomato, labelKey: 'dashboard.ingredients.i2_title', color: '#EF4444' },
  { id: 'cheese', imageSrc: ingredientImages.richParmesanCheese, labelKey: 'dashboard.ingredients.i4_title', color: '#FBBF24' },
  { id: 'basil', imageSrc: ingredientImages.magicBasilLeaf, labelKey: 'dashboard.ingredients.i5_title', color: '#4ADE80' }
];

const INGREDIENT_NAME_MAP = INGREDIENT_META.reduce((acc, item) => {
  acc[item.id] = item.labelKey;
  return acc;
}, {});

function formatTeamName(candidate, index = 0, t) {
  if (candidate?.teamName) return candidate.teamName;
  const idStr = candidate?.teamId ? candidate.teamId.slice(-4) : String(index + 1);
  return t ? t('synthesis.teamFormat', { id: idStr }) : `Team ${idStr}`;
}

export default function SynthesisRoom() {
  const navigate = useNavigate();
  const { teamId, teamName, activeChallenge } = useAppSession();
  const { t } = useTranslation();

  // Support plan
  const [planLoading, setPlanLoading] = useState(true);
  const [supportPlan, setSupportPlan] = useState({
    myIngredients: [],
    missingIngredients: [],
    complementaryTeams: [],
    rescueTeam: null,
    globalMissingIngredients: []
  });
  const [refreshToken, setRefreshToken] = useState(0);

  // Station phase: 'setup' | 'station' | 'ending'
  const [phase, setPhase] = useState('setup');
  const [stationCode, setStationCode] = useState(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [station, setStation] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [isReadying, setIsReadying] = useState(false);
  const [showEnding, setShowEnding] = useState(false);

  // My placed ingredients (optimistic local state, synced from Firebase on load)
  const [myPlaced, setMyPlaced] = useState([]);
  const [placedInitialized, setPlacedInitialized] = useState(false);

  // Load support plan
  useEffect(() => {
    let alive = true;
    if (!teamId || !activeChallenge?.id) {
      setSupportPlan({
        myIngredients: [],
        missingIngredients: INGREDIENT_META.map((i) => i.id),
        complementaryTeams: [],
        rescueTeam: null,
        globalMissingIngredients: []
      });
      setPlanLoading(false);
      return () => { alive = false; };
    }
    setPlanLoading(true);
    getSynthesisSupportPlan({ teamId, sessionId: activeChallenge.id })
      .then((plan) => { if (alive) { setSupportPlan(plan); setPlanLoading(false); } })
      .catch(() => { if (alive) setPlanLoading(false); });
    return () => { alive = false; };
  }, [teamId, activeChallenge?.id, refreshToken]);

  // Subscribe to station changes
  useEffect(() => {
    if (!stationCode) return;
    const unsub = subscribeSynthesisStation({
      stationCode,
      onChange: (data) => setStation(data)
    });
    return unsub;
  }, [stationCode]);

  // Initialize myPlaced from Firebase once when station first loads
  useEffect(() => {
    if (!station || !teamId || placedInitialized) return;
    const myData = station.teams?.[teamId];
    if (myData) {
      setMyPlaced(myData.placedIngredients || []);
      setPlacedInitialized(true);
    }
  }, [station, teamId, placedInitialized]);

  // Reset placed state when station code changes
  useEffect(() => {
    setMyPlaced([]);
    setPlacedInitialized(false);
  }, [stationCode]);

  // Watch for teams ready → trigger ending
  useEffect(() => {
    if (!station || phase !== 'station') return;
    const teams = Object.values(station.teams || {});
    if (teams.length < 1) return;

    const allPlacedIds = new Set(teams.flatMap((tm) => tm.placedIngredients || []));
    if (allPlacedIds.size < 5) return;

    if (teams.every((tm) => tm.ready)) {
      setPhase('ending');
      if (teamId && activeChallenge?.id) {
        saveLevelProgress({
          teamId,
          sessionId: activeChallenge.id,
          levelId: 'level8',
          status: 'completed'
        }).catch(console.error);
      }
      setTimeout(() => setShowEnding(true), 400);
    }
  }, [station, phase, teamId, activeChallenge]);

  // Derived values
  const myIngredients = supportPlan.myIngredients;
  const myUnplaced = myIngredients.filter((id) => !myPlaced.includes(id));

  // placementMap: ingredientId → teamId (who placed it)
  const placementMap = useMemo(() => {
    const map = {};
    if (!station) return map;
    // My placements take priority
    const myTeamData = station.teams?.[teamId];
    (myTeamData?.placedIngredients || []).forEach((id) => { map[id] = teamId; });
    // Then allies
    Object.values(station.teams || {}).forEach((tm) => {
      if (tm.teamId === teamId) return;
      (tm.placedIngredients || []).forEach((id) => { if (!map[id]) map[id] = tm.teamId; });
    });
    return map;
  }, [station, teamId]);

  const allPlacedCount = Object.keys(placementMap).length;
  const canSynthesize = allPlacedCount === 5;
  const myTeamData = station?.teams?.[teamId];
  const isReady = myTeamData?.ready || false;
  const otherTeams = station ? Object.values(station.teams || {}).filter((tm) => tm.teamId !== teamId) : [];
  const teamCount = station ? Object.keys(station.teams || {}).length : 0;

  const missingNames = supportPlan.missingIngredients.map((id) => t(INGREDIENT_NAME_MAP[id]) || id);
  const suggestedAlly = supportPlan.complementaryTeams[0] || null;

  const handleCreateStation = async () => {
    if (!teamId) return;
    setIsCreating(true);
    try {
      const { stationCode: code } = await createSynthesisStation({
        teamId,
        teamName: teamName || '',
        sessionId: activeChallenge?.id || ''
      });
      setStationCode(code);
      setPhase('station');
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinStation = async (codeOverride) => {
    const code = (codeOverride ?? joinCodeInput).trim();
    if (!teamId || code.length < 6) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      await joinSynthesisStation({
        stationCode: code,
        teamId,
        teamName: teamName || '',
        sessionId: activeChallenge?.id || ''
      });
      setStationCode(code);
      setPhase('station');
    } catch {
      setJoinError(t('synthesis.joinError'));
    } finally {
      setIsJoining(false);
    }
  };

  const handlePlaceIngredient = useCallback(async (ingredientId) => {
    if (!stationCode || !teamId) return;
    if (!myIngredients.includes(ingredientId) || myPlaced.includes(ingredientId)) return;
    const newPlaced = [...myPlaced, ingredientId];
    setMyPlaced(newPlaced);
    await updateSynthesisPlaced({ stationCode, teamId, placedIngredients: newPlaced }).catch(console.error);
  }, [stationCode, teamId, myIngredients, myPlaced]);

  const handleRemoveIngredient = useCallback(async (ingredientId) => {
    if (!stationCode || !teamId) return;
    const newPlaced = myPlaced.filter((id) => id !== ingredientId);
    setMyPlaced(newPlaced);
    await updateSynthesisPlaced({ stationCode, teamId, placedIngredients: newPlaced }).catch(console.error);
  }, [stationCode, teamId, myPlaced]);

  const handleToggleReady = async () => {
    if (!stationCode || !teamId || !canSynthesize) return;
    setIsReadying(true);
    try {
      await setSynthesisReady({ stationCode, teamId, ready: !isReady });
    } catch (e) {
      console.error(e);
    } finally {
      setIsReadying(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#0D0F1A] pb-8 relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#7C5CFC]/20 via-[#1A1D2E] to-[#0D0F1A] z-0 pointer-events-none border-t-4 border-[#7C5CFC]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] aspect-square bg-[#7C5CFC]/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />

      <div className="relative z-10 w-full pt-12 pb-6 px-4 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#4ADE80] to-[#38BDF8] drop-shadow-md">
          {t('synthesis.title')}
        </h1>
        <p className="text-gray-400 text-sm text-center mb-4">
          {phase === 'setup' ? t('synthesis.subtitleSetup') : t('synthesis.subtitleStation')}
        </p>
      </div>

      <div className="flex-1 w-full max-w-sm mx-auto px-4 flex flex-col relative z-10 gap-4">

        {/* ── SETUP PHASE ── */}
        {phase === 'setup' && (
          <>
            {!planLoading && supportPlan.missingIngredients.length > 0 && (
              <div className="rounded-2xl border border-amber-400/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-100">
                {t('synthesis.missingInfo', { count: supportPlan.myIngredients.length, missing: missingNames.join(', ') })}
              </div>
            )}

            {!planLoading && suggestedAlly && (
              <div className="rounded-2xl border border-[#4ADE80]/40 bg-[#14532d]/25 px-4 py-3 text-sm text-green-100">
                <Trans
                  i18nKey="synthesis.allyFound"
                  values={{
                    team: formatTeamName(suggestedAlly, 0, t),
                    ingredients: suggestedAlly.provides.map((id) => t(INGREDIENT_NAME_MAP[id]) || id).join(', ')
                  }}
                  components={{ 1: <span className="font-bold" /> }}
                />
              </div>
            )}

            {!planLoading && !suggestedAlly && supportPlan.rescueTeam && (
              <div className="rounded-2xl border border-pink-400/50 bg-pink-900/25 px-4 py-3 text-sm text-pink-100">
                <Trans
                  i18nKey="synthesis.rescueInitiated"
                  values={{ team: formatTeamName(supportPlan.rescueTeam, 0, t) }}
                  components={{ 1: <span className="font-bold" /> }}
                />
              </div>
            )}

            <div className="bg-[#1A1D2E]/50 backdrop-blur-md rounded-[2rem] border border-[#7C5CFC]/30 p-6 flex flex-col gap-4">
              <p className="text-center text-gray-300 text-sm">{t('synthesis.setupHint')}</p>

              <button
                type="button"
                disabled={isCreating}
                onClick={handleCreateStation}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#7C5CFC] to-[#5B21B6] border-b-4 border-[#4C1D95] active:border-b-0 active:translate-y-1 shadow-lg disabled:opacity-50"
              >
                {isCreating ? t('synthesis.creating') : t('synthesis.createBtn')}
              </button>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-gray-500 text-xs">{t('synthesis.or')}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={joinCodeInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setJoinCodeInput(val);
                    if (val.length === 6 && !isJoining) handleJoinStation(val);
                  }}
                  placeholder={t('synthesis.joinPlaceholder')}
                  disabled={isJoining}
                  className="force-ltr w-full rounded-xl bg-white/5 border border-white/20 px-3 py-3 text-white text-center text-xl font-mono tracking-widest placeholder-gray-600 focus:outline-none focus:border-[#7C5CFC]/60 disabled:opacity-60"
                />
                {isJoining && (
                  <div className="absolute end-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-[#7C5CFC] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {joinError && (
                <p className="text-red-400 text-sm text-center">{joinError}</p>
              )}
            </div>

            <button
              type="button"
              className="text-xs rounded-lg bg-[#7C5CFC]/20 border border-[#7C5CFC]/40 px-3 py-1.5 text-[#E9D5FF] self-center"
              onClick={() => setRefreshToken((v) => v + 1)}
            >
              {t('synthesis.recheckBtn')}
            </button>
          </>
        )}

        {/* ── STATION PHASE ── */}
        {phase === 'station' && (
          <>
            {/* Station code + connection status */}
            <div className="bg-[#1A1D2E]/80 rounded-2xl border border-[#7C5CFC]/30 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">{t('synthesis.stationCodeLabel')}</p>
                <p className="force-ltr text-2xl font-mono font-bold text-[#7C5CFC] tracking-widest">{stationCode}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(stationCode || '')}
                  className="text-xs bg-[#7C5CFC]/20 border border-[#7C5CFC]/40 rounded-lg px-2 py-1 text-[#E9D5FF]"
                >
                  {t('synthesis.copyBtn')}
                </button>
                <p className="text-xs text-gray-500">
                  {teamCount >= 2
                    ? t('synthesis.teamConnected', { count: teamCount })
                    : t('synthesis.waitingAlly')}
                </p>
              </div>
            </div>

            {/* 5 ingredient slots */}
            <div className="bg-[#1A1D2E]/50 backdrop-blur-md rounded-[2rem] border border-[#7C5CFC]/30 p-5 flex flex-col gap-4">
              <p className="text-center text-sm text-gray-400">{t('synthesis.slotsTitle')}</p>

              {[INGREDIENT_META.slice(0, 3), INGREDIENT_META.slice(3)].map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-3">
                  {row.map((meta) => {
                    const placedByTeam = placementMap[meta.id];
                    const isMine = myIngredients.includes(meta.id);
                    const isMyPlaced = placedByTeam === teamId;
                    const isAllyPlaced = placedByTeam && placedByTeam !== teamId;
                    const isEmpty = !placedByTeam;

                    return (
                      <div key={meta.id} className="flex flex-col items-center gap-1">
                        <div
                          onClick={() => {
                            if (isMyPlaced) handleRemoveIngredient(meta.id);
                            else if (isEmpty && isMine) handlePlaceIngredient(meta.id);
                          }}
                          className={[
                            'relative flex items-center justify-center w-16 h-16 rounded-xl border-2 transition-all duration-200',
                            placedByTeam ? 'border-transparent' : 'border-dashed border-gray-600 bg-gray-800/30',
                            isMyPlaced ? 'cursor-pointer active:scale-95 ring-2 ring-[#7C5CFC]/50' : '',
                            isEmpty && isMine ? 'cursor-pointer hover:border-[#7C5CFC]/60 hover:bg-[#7C5CFC]/10' : ''
                          ].join(' ')}
                          style={{ backgroundColor: placedByTeam ? `${meta.color}40` : '' }}
                        >
                          {placedByTeam ? (
                            <>
                              <img src={meta.imageSrc} alt={t(meta.labelKey)} className="w-11 h-11 object-contain" />
                              {isAllyPlaced && (
                                <span className="absolute -top-2 -end-2 text-[9px] bg-[#4ADE80] text-black font-bold rounded-full px-1 leading-4">
                                  {t('synthesis.allyBadge')}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-600 text-xl">?</span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 text-center leading-tight w-16">
                          {t(meta.labelKey)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}

              <p className="text-center text-xs text-gray-500">
                {allPlacedCount}/5 {t('synthesis.ingredientsPlaced')}
              </p>
            </div>

            {/* My ingredient pool */}
            {myUnplaced.length > 0 && (
              <div className="bg-[#1A1D2E]/50 rounded-2xl border border-white/10 p-4">
                <p className="text-xs text-gray-400 mb-3 text-center">{t('synthesis.myPool')}</p>
                <div className="flex justify-center gap-3 flex-wrap">
                  {myUnplaced.map((id) => {
                    const meta = INGREDIENT_META.find((m) => m.id === id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handlePlaceIngredient(id)}
                        className="w-16 h-16 rounded-xl border border-white/20 flex items-center justify-center active:scale-95 transition-transform"
                        style={{ backgroundColor: `${meta?.color}33` }}
                      >
                        <img src={meta?.imageSrc} alt={t(meta?.labelKey || '')} className="w-12 h-12 object-contain" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Team ready status */}
            <div className="bg-[#1A1D2E]/50 rounded-2xl border border-white/10 px-4 py-3">
              <div className="flex justify-around">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-400">{t('synthesis.myTeam')}</span>
                  <span className={`text-sm font-bold ${isReady ? 'text-[#4ADE80]' : 'text-gray-500'}`}>
                    {isReady ? `✓ ${t('synthesis.ready')}` : t('synthesis.notReady')}
                  </span>
                </div>
                {otherTeams.length > 0 ? otherTeams.map((tm, i) => (
                  <div key={tm.teamId} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400 text-center max-w-[80px] truncate">
                      {tm.teamName || formatTeamName(tm, i, t)}
                    </span>
                    <span className={`text-sm font-bold ${tm.ready ? 'text-[#4ADE80]' : 'text-gray-500'}`}>
                      {tm.ready ? `✓ ${t('synthesis.ready')}` : t('synthesis.notReady')}
                    </span>
                  </div>
                )) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400">{t('synthesis.ally')}</span>
                    <span className="text-sm text-gray-600">{t('synthesis.waitingAlly')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Synthesize / ready button */}
            {canSynthesize ? (
              <button
                type="button"
                disabled={isReadying}
                onClick={handleToggleReady}
                className={[
                  'w-full py-5 rounded-2xl font-bold text-xl transition-all duration-200 shadow-xl disabled:opacity-50',
                  isReady
                    ? 'bg-gradient-to-r from-[#4ADE80] to-[#16a34a] border-b-4 border-[#14532d] text-white'
                    : 'bg-gradient-to-r from-[#7C5CFC] to-[#5B21B6] border-b-4 border-[#4C1D95] text-white active:border-b-0 active:translate-y-1'
                ].join(' ')}
              >
                {isReady ? t('synthesis.readyPressed') : t('synthesis.synthesizeBtn')}
              </button>
            ) : (
              <p className="text-center text-gray-600 text-sm py-2">
                {t('synthesis.notEnoughIngredients')}
              </p>
            )}
          </>
        )}
      </div>

      {/* Completion modal */}
      <Modal
        isOpen={showEnding}
        onClose={() => navigate('/victory')}
        title={t('synthesis.completeTitle')}
        type="info"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center p-4">
          <div className="w-44 h-44 mb-6 rounded-[2rem] border-2 border-white/20 bg-gradient-to-b from-[#111827] to-[#1F2937] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
            <div className="w-full h-full rounded-[1.3rem] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(135deg,#334155,#0F172A)] p-2 overflow-hidden">
              <img src={uiImages.ultimatePizza} alt={t('synthesis.pizzaName')} className="w-full h-full object-cover rounded-[1rem]" />
            </div>
          </div>
          <p className="text-xl text-white font-bold mb-2 tracking-widest text-[#FBBF24]">{t('synthesis.pizzaName')}</p>
          <p className="text-sm text-gray-300 mb-8">{t('synthesis.completeDesc')}</p>
          <button
            onClick={() => navigate('/victory')}
            className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#4ADE80] to-[#16a34a] border-b-4 border-[#14532d] active:border-b-0 active:translate-y-1 shadow-lg"
          >
            {t('synthesis.nextStageBtn')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
