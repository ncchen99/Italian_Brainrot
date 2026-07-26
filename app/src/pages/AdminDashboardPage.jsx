import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  subscribeAllTeams,
  getTeamSessionDetail,
  getAllTeamSessions,
  getTeamUploads,
  deleteTeam,
  checkIsAdmin,
  cloneTeamProgress
} from '../services/adminService';
import { useAppSession } from '../contexts/AppSessionContext';
import { 
  ClockIcon, 
  ChartBarIcon, 
  ClipboardDocumentListIcon, 
  PhotoIcon, 
  TrashIcon, 
  TrophyIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  SignalIcon, 
  MagnifyingGlassIcon,
  IdentificationIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/solid';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';

const LEVEL_NAMES = {
  level1: 'Lv1 忍者排序',
  level2: 'Lv2 保險箱',
  level3: 'Lv3 點擊挑戰',
  level4: 'Lv4 水球排序',
  level5: 'Lv5 時間輸入',
  level6: 'Lv6 猩猩照片',
  level7: 'Lv7 天線同步',
  level8: 'Lv8 合成室'
};

const SYNTHESIS_LEVEL_MAP = {
  level1: 'flour',
  level2: 'tomato',
  level3: 'water',
  level4: 'cheese',
  level5: 'basil'
};

const INGREDIENT_LABELS = {
  flour: '麵粉',
  tomato: '番茄',
  water: '水',
  cheese: '起司',
  basil: '羅勒'
};

function msToCountdown(ms) {
  if (!ms || ms <= 0) return '已超時';
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

function formatTimestamp(ts) {
  if (!ts) return '—';
  let ms = ts;
  if (ts?.toMillis) ms = ts.toMillis();
  else if (typeof ts === 'object' && ts?.seconds) ms = ts.seconds * 1000;
  return new Date(ms).toLocaleString('zh-TW', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

// ── TeamCard ──────────────────────────────────────────────────────────────────
function TeamCard({ team, onOpenDetail }) {
  const now = Date.now();
  const endsAt = Number(team.activeSessionEndsAtMs);
  const remaining = team.activeSessionId && Number.isFinite(endsAt) ? endsAt - now : null;
  const isActive = remaining !== null && remaining > 0;
  const isExpired = remaining !== null && remaining <= 0;

  return (
    <button
      onClick={() => onOpenDetail(team.id)}
      className="w-full text-left bg-[#151A30]/90 border border-white/10 rounded-2xl p-4 shadow-md active:scale-[0.98] transition-all duration-150 hover:border-[#7C5CFC]/50 hover:shadow-[#7C5CFC]/10 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-bold text-white text-base truncate">{team.name || '未命名隊伍'}</span>
        <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 ${isActive ? 'bg-green-400 shadow-[0_0_6px] shadow-green-400' : 'bg-gray-600'}`} />
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 font-mono">
        <span>{team.id.slice(0, 10)}…</span>
        {isActive && (
          <span className="text-green-400 font-mono flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {msToCountdown(remaining)}
          </span>
        )}
        {isExpired && (
          <span className="text-red-400 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            已超時
          </span>
        )}
        {!team.activeSessionId && (
          <span className="text-gray-600">未開始</span>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-[#7C5CFC] font-medium">
        查看詳情 <ChevronRightIcon className="w-3 h-3" />
      </div>
    </button>
  );
}

// ── TeamDetailModal ───────────────────────────────────────────────────────────
function TeamDetailModal({ teamId, teamName, allTeams = [], onClose, onDeleted }) {
  const navigate = useNavigate();
  const { startImpersonating } = useAppSession();

  const [tab, setTab] = useState('progress');
  const [sessionDetail, setSessionDetail] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [deleteStep, setDeleteStep] = useState(0); // 0=idle 1=confirm 2=deleting
  const [deleteError, setDeleteError] = useState('');

  const [transferStep, setTransferStep] = useState(0); // 0=idle, 1=show form, 2=copying
  const [targetTeamId, setTargetTeamId] = useState('');
  const [transferError, setTransferError] = useState('');

  const handleImpersonateClick = () => {
    startImpersonating(teamId, teamName);
    onClose();
    navigate('/dashboard');
  };

  const handleTransferProgress = async () => {
    if (!targetTeamId) return;
    setTransferStep(2);
    setTransferError('');
    try {
      await cloneTeamProgress(teamId, targetTeamId, { copyName: false });
      alert('進度轉移成功！');
      setTransferStep(0);
      setTargetTeamId('');
      onClose();
    } catch (err) {
      console.error('Transfer progress failed:', err);
      setTransferError(err.message || '進度轉移失敗，請重試');
      setTransferStep(1);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getTeamSessionDetail(teamId),
      getAllTeamSessions(teamId),
      getTeamUploads(teamId)
    ]).then(([sd, sessions, ups]) => {
      if (cancelled) return;
      setSessionDetail(sd);
      setAllSessions(sessions);
      setUploads(ups);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [teamId]);

  const handleDelete = async () => {
    setDeleteStep(2);
    setDeleteError('');
    try {
      await deleteTeam(teamId);
      onDeleted(teamId);
    } catch (err) {
      setDeleteError(err.message || '刪除失敗，請重試');
      setDeleteStep(1);
    }
  };

  const progress = sessionDetail?.progress || {};
  const ingredients = Object.entries(SYNTHESIS_LEVEL_MAP)
    .filter(([lvl]) => progress[lvl]?.status === 'completed')
    .map(([, ing]) => INGREDIENT_LABELS[ing]);

  const TAB_LIST = [
    { key: 'progress', label: '進度', icon: ChartBarIcon },
    { key: 'sessions', label: '記錄', icon: ClipboardDocumentListIcon },
    { key: 'uploads', label: '圖片', icon: PhotoIcon }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-[#0F1524] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/10 flex-shrink-0">
          <div className="min-w-0 pr-2">
            <div className="font-bold text-white text-lg truncate">{teamName || '未命名隊伍'}</div>
            <div className="text-xs text-gray-500 mt-0.5 break-all">{teamId}</div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all active:scale-90"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-0 flex-shrink-0">
          {TAB_LIST.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${tab === key
                  ? 'bg-[#7C5CFC] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable Body - Styled scrollbar to be subtle */}
        <div className="overflow-y-auto flex-1 p-4 scrollbar-thin scrollbar-thumb-[#7C5CFC]/30 scrollbar-track-transparent">
          <style>{`
            .overflow-y-auto::-webkit-scrollbar { width: 4px; }
            .overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
            .overflow-y-auto::-webkit-scrollbar-thumb { background: rgba(124, 92, 252, 0.2); border-radius: 10px; }
            .overflow-y-auto { scrollbar-width: thin; scrollbar-color: rgba(124, 92, 252, 0.2) transparent; font-family: inherit; }
          `}</style>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#7C5CFC] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tab === 'progress' ? (
            <ProgressTab sessionDetail={sessionDetail} progress={progress} ingredients={ingredients} />
          ) : tab === 'sessions' ? (
            <SessionsTab sessions={allSessions} />
          ) : (
            <UploadsTab uploads={uploads} />
          )}
        </div>

        {/* Unified Actions Zone */}
        <div className="border-t border-white/10 p-4 flex-shrink-0 space-y-3 bg-white/5">
          {/* Main Action Row */}
          {transferStep === 0 && deleteStep === 0 && (
            <div className="flex gap-3">
              <button
                onClick={handleImpersonateClick}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-bold shadow-lg shadow-amber-500/10 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <IdentificationIcon className="w-4 h-4 text-white" />
                模擬此隊伍
              </button>
              <button
                onClick={() => setTransferStep(1)}
                className="flex-1 py-3 rounded-2xl bg-[#7C5CFC]/20 hover:bg-[#7C5CFC]/30 border border-[#7C5CFC]/40 text-[#C4B5FD] text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <ClipboardDocumentListIcon className="w-4 h-4" />
                轉移進度
              </button>
            </div>
          )}

          {/* Transfer Progress Interface */}
          {transferStep === 1 && (
            <div className="space-y-3 p-3 rounded-2xl border border-[#7C5CFC]/30 bg-[#7C5CFC]/5">
              <p className="text-sm font-bold text-[#C4B5FD] flex items-center gap-1.5">
                <ClipboardDocumentListIcon className="w-4.5 h-4.5" />
                轉移進度至其他隊伍
              </p>
              <p className="text-xs text-gray-400">
                此操作將會把「{teamName || '此小隊'}」的進度複製到目標隊伍，覆蓋目標隊伍原有的所有關卡進度與挑戰記錄！此操作無法復原。
              </p>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">選擇目標隊伍：</label>
                <select
                  value={targetTeamId}
                  onChange={(e) => setTargetTeamId(e.target.value)}
                  className="w-full bg-[#0F1524] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7C5CFC]"
                >
                  <option value="">-- 請選擇隊伍 --</option>
                  {allTeams
                    .filter((t) => t.id !== teamId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name || '未命名隊伍'} ({t.id.slice(0, 8)}…)
                      </option>
                    ))}
                </select>
              </div>

              {transferError && <p className="text-xs text-red-400 font-semibold">{transferError}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => { setTransferStep(0); setTargetTeamId(''); setTransferError(''); }}
                  className="flex-1 py-2 rounded-xl bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/20 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleTransferProgress}
                  disabled={!targetTeamId}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition-colors"
                >
                  確認覆蓋並轉移
                </button>
              </div>
            </div>
          )}

          {transferStep === 2 && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-[#7C5CFC] border-t-transparent rounded-full animate-spin" />
              進度轉移中，請稍候…
            </div>
          )}

          {/* Delete Section */}
          {transferStep === 0 && (
            <div>
              {deleteStep === 0 && (
                <button
                  onClick={() => setDeleteStep(1)}
                  className="w-full py-2.5 rounded-xl border border-red-500/20 bg-red-900/10 text-red-400 text-xs font-semibold hover:bg-red-900/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  刪除此隊伍
                </button>
              )}
              {deleteStep === 1 && (
                <div className="space-y-3 p-3 rounded-2xl border border-red-500/30 bg-red-950/10">
                  <p className="text-xs text-red-300 text-center">
                    確定刪除「<span className="font-bold text-white">{teamName}</span>」？此操作將會刪除該隊伍的全部進度與上傳圖片，無法復原。
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteStep(0)}
                      className="flex-1 py-2 rounded-xl bg-white/10 text-gray-300 text-xs font-semibold hover:bg-white/20 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                    >
                      確認刪除
                    </button>
                  </div>
                  {deleteError && <p className="text-xs text-red-400 text-center">{deleteError}</p>}
                </div>
              )}
              {deleteStep === 2 && (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-gray-400">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  刪除中…
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ProgressTab ───────────────────────────────────────────────────────────────
function ProgressTab({ sessionDetail, progress, ingredients }) {
  const session = sessionDetail?.session;
  const now = Date.now();
  const endsAt = Number(session?.endsAtMs);
  const remaining = session && Number.isFinite(endsAt) ? endsAt - now : null;

  return (
    <div className="space-y-4">
      {/* Session info */}
      <div className="bg-[#151A30]/80 border border-white/10 rounded-2xl p-4">
        <div className="text-xs font-bold text-gray-500 tracking-widest mb-3">
          挑戰時間
        </div>
        {session ? (
          <div className="space-y-2">
            {[
              { label: '開始', value: formatTimestamp(session.startedAtMs) },
              { label: '結束', value: formatTimestamp(session.endsAtMs) }
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="text-white font-mono">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">剩餘</span>
              <span className={`font-mono font-bold ${remaining !== null && remaining > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {remaining !== null ? msToCountdown(remaining) : '—'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">尚無進行中的挑戰</p>
        )}
      </div>

      {/* Level progress grid */}
      <div className="bg-[#151A30]/80 border border-white/10 rounded-2xl p-4">
        <div className="text-xs font-bold text-gray-500 tracking-widest mb-3">
          關卡進度
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(LEVEL_NAMES).map(([lvl, name]) => {
            const status = progress[lvl]?.status;
            const isCompleted = status === 'completed';
            const isFailed = status === 'failed';
            return (
              <div
                key={lvl}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${isCompleted
                    ? 'bg-green-900/30 border-green-500/30 text-green-300'
                    : isFailed
                      ? 'bg-red-900/30 border-red-500/30 text-red-300'
                      : 'bg-white/5 border-white/10 text-gray-500 opacity-60'
                  }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 ${isCompleted ? 'bg-green-500 border-none' : isFailed ? 'bg-red-500 border-none' : 'border-gray-700'}`}>
                  {isCompleted && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                  {isFailed && <XMarkIcon className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="truncate">{name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ingredients */}
      {ingredients.length > 0 && (
        <div className="bg-[#151A30]/80 border border-white/10 rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-500 tracking-widest mb-3">
            已收集食材
          </div>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ing) => (
              <span key={ing} className="px-3 py-1 rounded-full bg-[#7C5CFC]/20 border border-[#7C5CFC]/40 text-[#C4B5FD] text-xs font-medium">
                {ing}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Antenna info */}
      {progress.level6?.status === 'completed' && (
        <div className="bg-[#151A30]/80 border border-white/10 rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-500 tracking-widest mb-3">
            天線資訊
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">顏色</span>
            <span className={`font-bold flex items-center gap-1.5 ${progress.level6.antennaColor === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${progress.level6.antennaColor === 'red' ? 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]' : 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]'}`} />
              {progress.level6.antennaColor === 'red' ? '紅色' : '藍色'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">通關碼</span>
            <span className="font-mono font-bold text-[#FBBF24] tracking-widest">{progress.level6.passCode || '—'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SessionsTab ───────────────────────────────────────────────────────────────
function SessionsTab({ sessions }) {
  if (sessions.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">尚無歷史記錄</p>;
  }

  return (
    <div className="space-y-4">
      {sessions.map((session, i) => {
        const completedCount = Object.values(session.progress || {}).filter((p) => p.status === 'completed').length;
        const totalLevels = Object.keys(LEVEL_NAMES).length;
        return (
          <div key={session.id} className="bg-[#151A30]/80 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-white">第 {sessions.length - i} 次挑戰</span>
              <span className="text-xs text-gray-400 font-mono">{formatTimestamp(session.startedAtMs)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-gray-400">完成關卡</span>
              <span className={`font-bold ${completedCount === totalLevels ? 'text-green-400' : 'text-[#FBBF24]'}`}>
                {completedCount} / {totalLevels}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(LEVEL_NAMES).map(([lvl, name]) => {
                const status = session.progress?.[lvl]?.status;
                const isCompleted = status === 'completed';
                const isFailed = status === 'failed';
                return (
                  <div
                    key={lvl}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs border ${isCompleted
                        ? 'bg-green-900/20 border-green-500/20 text-green-400'
                        : isFailed
                          ? 'bg-red-900/20 border-red-500/20 text-red-400'
                          : 'bg-white/5 border-white/5 text-gray-600'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${isCompleted ? 'bg-green-500 border-none' : isFailed ? 'bg-red-500 border-none' : 'border-gray-700 font-normal outline-none'}`}>
                      {isCompleted && <CheckIcon className="w-3 h-3 text-white" />}
                      {isFailed && <XMarkIcon className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate">{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── UploadsTab ────────────────────────────────────────────────────────────────
function UploadsTab({ uploads }) {
  if (uploads.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">尚無上傳圖片</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {uploads.map((upload) => (
        <a
          key={upload.id}
          href={upload.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl overflow-hidden border border-white/10 bg-[#151A30]/80 hover:border-[#7C5CFC]/50 transition-colors active:scale-95"
        >
          <img
            src={upload.imageUrl}
            alt={upload.levelId}
            className="w-full aspect-square object-cover"
          />
          <div className="px-2 py-1.5 text-center text-xs text-gray-400 font-medium">
            {LEVEL_NAMES[upload.levelId] || upload.levelId}
          </div>
        </a>
      ))}
    </div>
  );
}

// ── Main AdminDashboardPage ────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [authChecking, setAuthChecking] = useState(true);
  const [teams, setTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Auth guard
  useEffect(() => {
    if (!auth) { navigate('/admin', { replace: true }); return; }
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isAdmin = (user.email === ADMIN_EMAIL) || (await checkIsAdmin(user.email));
        if (isAdmin) {
          setAuthChecking(false);
          return;
        }
      }
      navigate('/admin', { replace: true });
    });
    return unsub;
  }, [navigate]);

  // Subscribe to teams list (live)
  useEffect(() => {
    if (authChecking) return;
    const unsub = subscribeAllTeams({
      onChange: (data) => {
        setTeams(data);
        setTeamsLoaded(true);
        setLastRefresh(new Date());
      },
      onError: () => setTeamsLoaded(true)
    });
    return unsub;
  }, [authChecking]);

  const handleSignOut = async () => {
    if (auth) await signOut(auth).catch(() => { });
    navigate('/admin', { replace: true });
  };

  const handleDeleted = useCallback((deletedId) => {
    setTeams((prev) => prev.filter((t) => t.id !== deletedId));
    setSelectedTeamId(null);
  }, []);

  const filteredTeams = teams.filter((t) => {
    const q = searchQuery.toLowerCase();
    return !q || (t.name || '').toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
  });

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const now = Date.now();
  const activeCount = teams.filter((t) => {
    const ends = Number(t.activeSessionEndsAtMs);
    return t.activeSessionId && Number.isFinite(ends) && ends > now;
  }).length;

  if (authChecking) {
    return (
      <div className="w-full min-h-screen bg-[#0D0F1A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7C5CFC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    // The admin panel is Chinese-only and not translated, so it stays LTR
    // regardless of the player-facing language selection.
    <div dir="ltr" className="w-full min-h-screen bg-[#0D0F1A] text-white relative pb-8">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-[#7C5CFC]/15 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 sticky top-0 bg-[#0D0F1A]/95 backdrop-blur border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div>
          <div className="font-bold text-lg text-white flex items-center gap-2">
            後臺管理
          </div>
          <div className="text-xs text-gray-500">
            {lastRefresh ? `更新 ${lastRefresh.toLocaleTimeString('zh-TW')}` : '連接中…'}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 rounded-xl bg-white/10 text-sm text-gray-300 hover:bg-white/20 transition-colors active:scale-95 flex items-center gap-2"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          登出
        </button>
      </div>

      <div className="relative z-10 px-4 pt-5 space-y-5 max-w-md mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#151A30]/90 border border-white/10 rounded-2xl p-4 text-center group">
            <UserGroupIcon className="w-5 h-5 mx-auto mb-1 text-gray-400 group-hover:text-white transition-colors" />
            <div className="text-2xl font-bold text-white">{teams.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">隊伍總數</div>
          </div>
          <div className="bg-[#151A30]/90 border border-green-500/30 rounded-2xl p-4 text-center group">
            <SignalIcon className="w-5 h-5 mx-auto mb-1 text-green-500/50 group-hover:text-green-400 transition-colors" />
            <div className="text-2xl font-bold text-green-400">{activeCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">進行中</div>
          </div>
          <div className="bg-[#151A30]/90 border border-white/10 rounded-2xl p-4 text-center group">
            <ClockIcon className="w-5 h-5 mx-auto mb-1 text-gray-600 group-hover:text-gray-400 transition-colors" />
            <div className="text-2xl font-bold text-gray-400">{teams.length - activeCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">已結束</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            id="admin-search-input"
            type="text"
            placeholder="搜尋隊伍名稱…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151A30]/90 border border-white/10 rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7C5CFC]/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm"
            >✕</button>
          )}
        </div>

        {/* Team List */}
        <div className="space-y-3">
          {!teamsLoaded && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
              <div className="w-5 h-5 border-2 border-[#7C5CFC] border-t-transparent rounded-full animate-spin" />
              載入隊伍資料…
            </div>
          )}
          {teamsLoaded && filteredTeams.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-500">
              {searchQuery ? '沒有符合的隊伍' : '尚無隊伍資料'}
            </div>
          )}
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onOpenDetail={(id) => setSelectedTeamId(id)}
            />
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTeamId && (
        <TeamDetailModal
          teamId={selectedTeamId}
          teamName={selectedTeam?.name || ''}
          allTeams={teams}
          onClose={() => setSelectedTeamId(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
