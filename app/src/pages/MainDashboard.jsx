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
import { markRecentScan, subscribeSessionProgress, subscribeTeamProgress } from '../services/progressService';

const INGREDIENTS_META = [
  { id: 'i1', levelId: 'level1', iconSrc: ingredientImages.flour, title: '陳年特級麵粉', description: '一袋散發著金光的特級麵粉，是披薩的靈魂基礎。', imageSrc: ingredientImages.premiumFlour, activeColor: '#FBBF24', collectedOrder: 1 },
  { id: 'i2', levelId: 'level2', iconSrc: ingredientImages.tomato, title: '神聖番茄', description: '傳說中能讓醬汁香氣瞬間滿溢的稀有番茄。', imageSrc: ingredientImages.holyTomato, activeColor: '#F97316', collectedOrder: 2 },
  { id: 'i3', levelId: 'level3', iconSrc: ingredientImages.water, title: '純淨山泉水', description: '提拉米蘇大師加持過的涼爽泉水。', imageSrc: ingredientImages.pureSpringWater, activeColor: '#38BDF8', collectedOrder: 3 },
  { id: 'i4', levelId: 'level4', iconSrc: ingredientImages.cheese, title: '濃郁帕瑪森起司', description: '風味扎實、鹹香濃郁，是披薩的靈魂重擊。', imageSrc: ingredientImages.richParmesanCheese, activeColor: '#F59E0B', collectedOrder: 4 },
  { id: 'i5', levelId: 'level5', iconSrc: ingredientImages.basil, title: '魔法羅勒葉', description: '最後那一抹清香，讓終極披薩完成進化。', imageSrc: ingredientImages.magicBasilLeaf, activeColor: '#4ADE80', collectedOrder: 5 }
];

const TASKS_META = [
  { id: 'level1', title: '關卡 1：忍者的修煉' },
  { id: 'level2', title: '關卡 2：舞鞋在哪裡？' },
  { id: 'level3', title: '關卡 3：吵鬧的青蛙' },
  { id: 'level4', title: '關卡 4：水球空投警報' },
  { id: 'level5', title: '關卡 5：沙漠與斷網的絕望' },
  { id: 'level6', title: '關卡 6：小心暴走猩猩' },
  { id: 'level7', title: '關卡 7：潮鞋防衛戰' },
  { id: 'level8', title: '關卡 8：終極合成協作站' }
];

export default function MainDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('backpack');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState('');
  const [fullscreenHint, setFullscreenHint] = useState(false);
  const { teamName, teamId, activeChallenge } = useAppSession();
  const [progressMap, setProgressMap] = useState({});

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
          return { ...task, state: 'completed', label: '已完成', accent: '#7C5CFC' };
        }
        if (isSynthesisUnlocked) {
          return { ...task, state: 'ready', label: '可前往', accent: '#4ADE80' };
        }
        return { ...task, state: 'locked', label: '尚未解鎖', accent: '#6B7280' };
      }

      const status = levelProgressMap[task.id];
      if (status === 'completed') {
        return { ...task, state: 'completed', label: '已完成', accent: '#7C5CFC' };
      }
      if (status === 'failed') {
        return { ...task, state: 'retry', label: '待重試', accent: '#F97316' };
      }
      if (task.id === firstUnfinishedLevelId) {
        return { ...task, state: 'active', label: '進行中', accent: '#FBBF24' };
      }
      return { ...task, state: 'pending', label: '待挑戰', accent: '#94A3B8' };
    }),
    [firstUnfinishedLevelId, isSynthesisUnlocked, levelProgressMap]
  );
  const displayTeamName = teamName || '未命名小隊';
  const challengeRemainingSeconds = activeChallenge?.endsAtMs
    ? Math.max(0, Math.ceil((activeChallenge.endsAtMs - Date.now()) / 1000))
    : null;

  const handleScanClick = () => {
    setScanError('');
    setScannerOpen(true);
  };

  const handleScanResult = async (scanInput) => {
    const targetRoute = getRouteByScanCode(scanInput);
    if (!targetRoute) {
      setScanError('無效 QR Code，請重新掃描正確關卡。');
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
          <div className="text-xs text-gray-400 font-bold mb-1">目前小隊</div>
          <div className="text-[#FBBF24] font-bold text-lg">{displayTeamName}</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-400 font-bold mb-1">剩餘時間</div>
          {challengeRemainingSeconds === null ? (
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl border-2 font-bold font-mono text-xl tracking-wider bg-[#1A1D2E] border-[#7C5CFC]/50 text-white">
              --:--
            </div>
          ) : (
            <CountdownTimer
              key={`${activeChallenge?.id || 'nosession'}-${challengeRemainingSeconds}`}
              initialSeconds={challengeRemainingSeconds}
              isRunning={challengeRemainingSeconds > 0}
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
              建議切換全螢幕以獲得最佳體驗（點此嘗試）
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

          {/* Collected Items Grid */}
          <div className="grid grid-cols-2 gap-4 pb-24">
            {collectedIngredients.map((item) => (
              <ItemCard
                key={item.id}
                title={item.title}
                description={item.description}
                isCollected={item.isCollected}
                imageSrc={item.imageSrc}
                glowColor={item.activeColor}
              />
            ))}
            {collectedIngredients.length === 0 && (
              <div className="col-span-2 rounded-2xl border border-dashed border-gray-600 bg-[#151A30]/70 px-4 py-8 text-center text-gray-400 text-sm">
                目前還沒有已收集材料，請先前往關卡取得食材。
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Tasks Tab View */
        <div className="relative z-10 w-full max-w-sm w-full animate-in fade-in duration-300">
          <h2 className="text-2xl font-bold text-[#FBBF24] mb-4 drop-shadow-md">待辦任務清單</h2>
          
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
                    {task.title}
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
