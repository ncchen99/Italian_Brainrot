import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { checkIsAdmin } from '../services/adminService';
import { 
  ExclamationCircleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/solid';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [checking, setChecking] = useState(true);

  // If already signed in as admin, go straight to dashboard
  useEffect(() => {
    if (!auth) { setChecking(false); return; }
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isAdmin = (user.email === ADMIN_EMAIL) || (await checkIsAdmin(user.email));
        if (isAdmin) {
          navigate('/admin/dashboard', { replace: true });
          return;
        } else {
          try { await signOut(auth); } catch {}
        }
      }
      setChecking(false);
    });
    return unsub;
  }, [navigate]);

  const handleGoogleLogin = async () => {
    if (!auth) {
      setErrorMsg('Firebase 尚未初始化，請確認環境設定。');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const isAdmin = (result.user.email === ADMIN_EMAIL) || (await checkIsAdmin(result.user.email));
      if (!isAdmin) {
        await signOut(auth);
        setErrorMsg(`此帳號（${result.user.email}）沒有管理員權限。`);
      }
      // onAuthStateChanged will handle redirection if isAdmin is true
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('登入視窗已關閉，請重新嘗試。');
      } else {
        setErrorMsg(err.message || '登入失敗，請稍後再試。');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="w-full min-h-screen bg-[#0D0F1A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7C5CFC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    // Untranslated Chinese-only admin surface; keep it LTR.
    <div dir="ltr" className="w-full min-h-screen bg-[#0D0F1A] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#7C5CFC]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-48 h-48 rounded-full bg-[#F97316]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm bg-[#151A30]/95 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-5">
        {/* Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C5CFC]/20 border border-[#7C5CFC]/40">
          <span className="w-2 h-2 rounded-full bg-[#7C5CFC] animate-pulse" />
          <span className="text-xs font-bold tracking-widest text-[#C4B5FD]">ADMIN PANEL</span>
        </div>

        {/* Icon */}
        <AcademicCapIcon className="w-16 h-16 text-[#7C5CFC]" />

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white leading-tight">義大利腦蟲<br />後臺管理系統</h1>
          <p className="mt-2 text-sm text-gray-400">請使用管理員 Google 帳號登入</p>
        </div>

        {/* Google Login Button */}
        <button
          id="admin-google-login-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white text-gray-800 font-semibold text-sm shadow-lg hover:bg-gray-50 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {loading ? '登入中…' : '使用 Google 帳號登入'}
        </button>

        {errorMsg && (
          <div className="w-full flex items-start gap-2 px-4 py-3 rounded-xl bg-red-900/40 border border-red-500/40 text-red-200 text-sm">
            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <p className="text-xs text-gray-600 text-center">僅限授權管理員帳號存取</p>
      </div>
    </div>
  );
}
