import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSession } from '../contexts/AppSessionContext';
import { removeCurrentAuthUser, wipeCurrentTeamData } from '../services/resetService';

const SECRET_PASSPHRASE = 'RESET-ITALIA-2026';
const HOLD_TO_CONFIRM_MS = 2800;

export default function HiddenResetPage() {
  const navigate = useNavigate();
  const holdTimerRef = useRef(null);
  const [passphrase, setPassphrase] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { teamId, teamName, clearSessionState } = useAppSession();

  const canRun =
    passphrase.trim() === SECRET_PASSPHRASE &&
    confirmName.trim() === (teamName || '').trim() &&
    !isDeleting;

  const runReset = async () => {
    if (!canRun) return;
    setIsDeleting(true);
    setErrorText('');
    setStatusText('正在清除帳號與任務記錄...');
    try {
      await wipeCurrentTeamData({ teamId });
      await removeCurrentAuthUser();
      clearSessionState();
      setStatusText('清除完成，正在返回登入頁...');
      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 600);
    } catch (error) {
      setErrorText(error?.message || '清除失敗，請稍後再試。');
      setStatusText('');
    } finally {
      setIsDeleting(false);
    }
  };

  const startHold = () => {
    if (!canRun || holdTimerRef.current) return;
    setStatusText('長按中，請維持不放...');
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      runReset();
    }, HOLD_TO_CONFIRM_MS);
  };

  const stopHold = () => {
    if (!holdTimerRef.current) return;
    window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    if (!isDeleting) {
      setStatusText('已取消，請重新長按。');
    }
  };

  return (
    <div className="w-full min-h-screen px-6 py-8 bg-[#0D0F1A] text-gray-200">
      <div className="max-w-sm mx-auto rounded-2xl border border-white/10 bg-[#151A30]/95 p-5">
        <h1 className="text-sm tracking-[0.2em] text-gray-400 mb-3">SYNC CHECKPOINT</h1>
        <p className="text-xs text-gray-500 mb-6">
          僅供系統維護。請勿提供給一般使用者。
        </p>

        <label className="block text-xs text-gray-400 mb-2">維護碼</label>
        <input
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="w-full mb-4 rounded-xl bg-[#0F172A] border border-white/10 px-3 py-2 text-sm"
          autoComplete="off"
        />

        <label className="block text-xs text-gray-400 mb-2">確認目前小隊名稱</label>
        <input
          type="text"
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          className="w-full mb-4 rounded-xl bg-[#0F172A] border border-white/10 px-3 py-2 text-sm"
          autoComplete="off"
        />

        <button
          type="button"
          onPointerDown={startHold}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          disabled={!canRun}
          className="w-full rounded-xl border border-[#F97316]/40 bg-[#7F1D1D]/50 py-3 text-sm disabled:opacity-40"
        >
          長按 {Math.round(HOLD_TO_CONFIRM_MS / 1000)} 秒以執行維護
        </button>

        {statusText ? <p className="mt-3 text-xs text-amber-300">{statusText}</p> : null}
        {errorText ? <p className="mt-3 text-xs text-pink-300">{errorText}</p> : null}
      </div>
    </div>
  );
}
