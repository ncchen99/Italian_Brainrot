import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigationBar from '../components/BottomNavigationBar';
import CountdownTimer from '../components/CountdownTimer';
import ItemCard from '../components/ItemCard';
import QRCodeScannerModal from '../components/QRCodeScannerModal';
import { ingredientImages, uiImages } from '../assets';
import { getRouteByScanCode } from '../scanCodes';
import { useAppSession } from '../contexts/AppSessionContext';
import { requestAppFullscreen, isFullscreenActive } from '../services/fullscreenService';
import { grantScanAccess } from '../services/scanAccessService';
import { subscribeSessionProgress, subscribeTeamProgress, markRecentScan } from '../services/progressService';
import { useTranslation } from 'react-i18next';

const INGREDIENTS_META = [
  { id: 'i1', levelId: 'level1', iconSrc: ingredientImages.flour, titleKey: 'dashboard.ingredients.i1_title', descKey: 'dashboard.ingredients.i1_desc', imageSrc: ingredientImages.premiumFlour, activeColor: '#FBBF24', collectedOrder: 1 },
  { id: 'i2', levelId: 'level2', iconSrc: ingredientImages.tomato, titleKey: 'dashboard.ingredients.i2_title', descKey: 'dashboard.ingredients.i2_desc', imageSrc: ingredientImages.holyTomato, activeColor: '#F97316', collectedOrder: 2 },
  { id: 'i3', levelId: 'level3', iconSrc: ingredientImages.water, titleKey: 'dashboard.ingredients.i3_title', descKey: 'dashboard.ingredients.i3_desc', imageSrc: ingredientImages.pureSpringWater, activeColor: '#38BDF8', collectedOrder: 3 },
  { id: 'i4', levelId: 'level4', iconSrc: ingredientImages.cheese, titleKey: 'dashboard.ingredients.i4_title', descKey: 'dashboard.ingredients.i4_desc', imageSrc: ingredientImages.richParmesanCheese, activeColor: '#F59E0B', collectedOrder: 4 },
  { id: 'i5', levelId: 'level5', iconSrc: ingredientImages.basil, titleKey: 'dashboard.ingredients.i5_title', descKey: 'dashboard.ingredients.i5_desc', imageSrc: ingredientImages.magicBasilLeaf, activeColor: '#4ADE80', collectedOrder: 5 }
];

const TASKS_META = [
  { id: 'level1', titleKey: 'dashboard.tasks.level1' },
  { id: 'level2', titleKey: 'dashboard.tasks.level2' },
  { id: 'level3', titleKey: 'dashboard.tasks.level3' },
  { id: 'level4', titleKey: 'dashboard.tasks.level4' },
  { id: 'level5', titleKey: 'dashboard.tasks.level5' },
  { id: 'level6', titleKey: 'dashboard.tasks.level6' },
  { id: 'level7', titleKey: 'dashboard.tasks.level7' },
  { id: 'level8', titleKey: 'dashboard.tasks.level8' }
];

export default function MainDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('backpack');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState('');
  const [fullscreenHint, setFullscreenHint] = useState(false);
  const { teamName, teamId, activeChallenge } = useAppSession();
  const [progressMap, setProgressMap] = useState({});
  const { t } = useTranslation();

  useEffect(() => {
    if (!teamId) {
      setProgressMap({});
      return () => {};
    }

    let teamProgressMap = {};
    let sessionProgressMap = {};
    const mergeAndSet = () => {
      setProgressMap({ ...teamProgressMap, ...sessionProgressMap });
    };

    const unsubscribeTeam = subscribeTeamProgress({
      teamId,
      onChange: (result) => {
        teamProgressMap = result || {};
        mergeAndSet();
      },
      onError: () => {
        teamProgressMap = {};
        mergeAndSet();
      }
    });

    if (!activeChallenge?.id) {
      return unsubscribeTeam;
    }

    const unsubscribeSession = subscribeSessionProgress({
      teamId,
      sessionId: activeChallenge.id,
      onChange: (result) => {
        sessionProgressMap = result || {};
        mergeAndSet();
      },
      onError: () => {
        sessionProgressMap = {};
        mergeAndSet();
      }
    });

    return () => {
      unsubscribeSession();
      unsubscribeTeam();
    };
  }, [teamId, activeChallenge?.id]);

  const targetIngredients = useMemo(
    () => INGREDIENTS_META.map((item) => ({
      ...item,
      isCollected: progressMap[item.levelId]?.status === 'completed'
    })),
    [progressMap]
  );

  const collectedItemIds = targetIngredients.filter((item) => item.isCollected).map((item) => item.id);
  const collectedIngredients = targetIngredients.filter((item) => item.isCollected);
  const isSynthesisUnlocked = collectedIngredients.length === INGREDIENTS_META.length;
  
  const displayedItems = [...collectedIngredients];
  if (progressMap['level6']?.status === 'completed' && progressMap['level6']?.antennaColor) {
    const color = progressMap['level6'].antennaColor;
    const passCode = progressMap['level6'].passCode || '???';
    const colorTrans = color === 'red' ? t('dashboard.meta.red') : t('dashboard.meta.blue');
    displayedItems.push({
      id: 'antenna_fragment',
      title: t('dashboard.meta.antennaFragment', { color: colorTrans }),
      description: t('dashboard.meta.antennaDesc', { passCode }),
      isCollected: true,
      imageSrc: color === 'red' ? uiImages.wifiRed : uiImages.wifiBlue,
      activeColor: color === 'red' ? '#EF4444' : '#3B82F6'
    });
  }

  const levelProgressMap = useMemo(() => {
    const map = {};
    TASKS_META.forEach((task) => {
      map[task.id] = progressMap[task.id]?.status || null;
    });
    return map;
  }, [progressMap]);
  const firstUnfinishedLevelId = useMemo(() => {
    const target = TASKS_META.filter((task) => task.id !== 'level8')
      .find((task) => levelProgressMap[task.id] !== 'completed');
    return target?.id || null;
  }, [levelProgressMap]);
  const taskItems = useMemo(
    () => TASKS_META.map((task) => {
      if (task.id === 'level8') {
        const synthesisStatus = levelProgressMap.level8;
        if (synthesisStatus === 'completed') {
          return { ...task, state: 'completed', label: t('dashboard.status.completed'), accent: '#7C5CFC' };
        }
        if (isSynthesisUnlocked) {
          return { ...task, state: 'ready', label: t('dashboard.status.ready'), accent: '#4ADE80' };
        }
        return { ...task, state: 'locked', label: t('dashboard.status.locked'), accent: '#6B7280' };
      }

      const status = levelProgressMap[task.id];
      if (status === 'completed') {
        return { ...task, state: 'completed', label: t('dashboard.status.completed'), accent: '#7C5CFC' };
      }
      if (status === 'failed') {
        return { ...task, state: 'retry', label: t('dashboard.status.retry'), accent: '#F97316' };
      }
      if (task.id === firstUnfinishedLevelId) {
        return { ...task, state: 'active', label: t('dashboard.status.active'), accent: '#FBBF24' };
      }
      return { ...task, state: 'pending', label: t('dashboard.status.pending'), accent: '#94A3B8' };
    }),
    [firstUnfinishedLevelId, isSynthesisUnlocked, levelProgressMap, t]
  );
  const displayTeamName = teamName || t('dashboard.meta.unnamedTeam');
  const challengeEndsAtMs = Number(activeChallenge?.endsAtMs);
  const challengeRemainingSeconds = Number.isFinite(challengeEndsAtMs)
    ? Math.ceil((challengeEndsAtMs - Date.now()) / 1000)
    : null;

  const handleScanClick = () => {
    setScanError('');
    setScannerOpen(true);
  };

  const handleScanResult = async (scanInput) => {
    const targetRoute = getRouteByScanCode(scanInput);
    if (!targetRoute) {
      setScanError(t('dashboard.meta.invalidQr'));
      return;
    }

    grantScanAccess(targetRoute);
    if (teamId) {
      markRecentScan({ teamId, route: targetRoute, code: String(scanInput || '') }).catch(() => {});
    }

    setScannerOpen(false);
    navigate(targetRoute);
  };

  const handleTryFullscreen = async () => {
    const success = await requestAppFullscreen();
    if (!success) {
      setFullscreenHint(true);
      return;
    }
    setFullscreenHint(false);
  };

  return (
    <div className="relative w-full min-h-screen pb-28 pt-6 px-4 flex flex-col items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={uiImages.levelBackground} alt="" className="w-full h-full object-cover opacity-35" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D0F1A]/90 via-[#131A34]/85 to-[#1B1140]/95"></div>
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#7C5CFC]/20 blur-3xl"></div>

      {/* Top Header */}
      <div className="relative z-10 w-full max-w-sm flex justify-between items-center bg-[#151A30]/90 p-4 rounded-3xl border border-white/10 shadow-lg mb-6 isolate">
        <div>
          <div className="text-xs text-gray-400 font-bold mb-1">{t('dashboard.meta.currentTeam')}</div>
          <div className="text-[#FBBF24] font-bold text-lg">{displayTeamName}</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-400 font-bold mb-1">{t('dashboard.meta.remainingTime')}</div>
          {challengeRemainingSeconds === null ? (
            <div className="force-ltr inline-flex items-center justify-center px-4 py-2 rounded-xl border-2 font-bold font-mono text-xl tracking-wider bg-[#1A1D2E] border-[#7C5CFC]/50 text-white">
              --:--
            </div>
          ) : challengeRemainingSeconds <= 0 ? (
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl border-2 font-bold text-sm bg-[#1A1D2E] border-[#7C5CFC]/50 text-white">
              {t('dashboard.meta.zeroMinutes')}
            </div>
          ) : (
            <CountdownTimer
              key={`${activeChallenge?.id || 'nosession'}-${challengeRemainingSeconds}`}
              initialSeconds={challengeRemainingSeconds}
              isRunning
            />
          )}
        </div>
      </div>

      {activeTab === 'backpack' ? (
        <div className="relative z-10 w-full max-w-sm w-full animate-in fade-in duration-300">
          {!isFullscreenActive() || fullscreenHint ? (
            <button
              onClick={handleTryFullscreen}
              className="w-full mb-4 text-sm rounded-xl bg-[#7C5CFC]/20 border border-[#7C5CFC]/40 px-3 py-2 text-[#E9D5FF]"
            >
              {t('dashboard.meta.fullscreenHint')}
            </button>
          ) : null}
          
          {/* Progress Icons */}
          <div className="bg-[#151A30]/90 p-4 rounded-3xl border border-white/10 shadow-lg mb-6">
            <div className="flex justify-between items-center px-1">
              {targetIngredients.map((item) => {
                const isCollected = collectedItemIds.includes(item.id);
                return (
                  <div key={item.id} className="relative">
                    <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isCollected ? 'bg-[#1A1D2E]' : 'bg-gray-800 opacity-70 border border-gray-600'}`}>
                      {isCollected && (
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                          <rect x="2" y="2" width="44" height="44" rx="16" stroke={item.activeColor} strokeWidth="2.5" />
                          <rect x="5" y="5" width="38" height="38" rx="13" stroke={item.activeColor} strokeOpacity="0.5" strokeWidth="1.5" />
                        </svg>
                      )}
                      <span
                        className="w-7 h-7"
                        style={{
                          backgroundColor: isCollected ? item.activeColor : '#6B7280',
                          WebkitMaskImage: `url(${item.iconSrc})`,
                          maskImage: `url(${item.iconSrc})`,
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          filter: isCollected ? `drop-shadow(0 0 7px ${item.activeColor}99)` : 'none'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-24">
            {displayedItems.map((item) => (
              <ItemCard
                key={item.id}
                title={item.titleKey ? t(item.titleKey) : item.title}
                description={item.descKey ? t(item.descKey) : item.description}
                isCollected={item.isCollected}
                imageSrc={item.imageSrc}
                glowColor={item.activeColor}
              />
            ))}
            {displayedItems.length === 0 && (
              <div className="col-span-2 rounded-2xl border border-dashed border-gray-600 bg-[#151A30]/70 px-4 py-8 text-center text-gray-400 text-sm">
                {t('dashboard.meta.noIngredients')}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Tasks Tab View */
        <div className="relative z-10 w-full max-w-sm w-full animate-in fade-in duration-300">
          <h2 className="text-2xl font-bold text-[#FBBF24] mb-4 drop-shadow-md">{t('dashboard.meta.taskList')}</h2>
          
          <div className="space-y-3">
            {taskItems.map((task) => {
              const isCompleted = task.state === 'completed';
              const isActive = task.state === 'active';
              const isLocked = task.state === 'locked';

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border shadow-md flex justify-between items-center ${
                    isLocked ? 'bg-gray-800/50 border-gray-700 text-gray-500' : 'bg-[#151A30]/90 border-white/10'
                  }`}
                  style={{ borderLeftWidth: 4, borderLeftColor: task.accent }}
                >
                  <span className={isCompleted ? 'line-through text-gray-400' : 'text-white font-bold'}>
                    {t(task.titleKey)}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${
                      isActive ? 'animate-pulse' : ''
                    }`}
                    style={{
                      color: task.accent,
                      borderColor: `${task.accent}88`,
                      backgroundColor: `${task.accent}22`
                    }}
                  >
                    {task.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shared Navigation Component */}
      <BottomNavigationBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onScanClick={handleScanClick}
      />
      <QRCodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanResult}
      />
      {scanError ? (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 max-w-sm w-[90%] rounded-xl border border-pink-500/40 bg-pink-900/50 px-3 py-2 text-sm text-pink-100">
          {scanError}
        </div>
      ) : null}
    </div>
  );
}
