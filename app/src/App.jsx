import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAppSession } from './contexts/AppSessionContext';
import { useTranslation } from 'react-i18next';

// Pages
import LoginPage from './pages/LoginPage';
import MainDashboard from './pages/MainDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
// import ResultPage from './pages/ResultPage';
// import SynthesisRoom from './pages/SynthesisRoom';
// import VictoryPage from './pages/VictoryPage';

// Import levels
import Level1NinjaSort from './levels/Level1NinjaSort';
import Level2SafeLock from './levels/Level2SafeLock';
import Level3TapChallenge from './levels/Level3TapChallenge';
import Level4WaterBalloonSort from './levels/Level4WaterBalloonSort';
import Level5TimeInput from './levels/Level5TimeInput';
import Level6GorillaPhoto from './levels/Level6GorillaPhoto';
import Level7AntennaSync from './levels/Level7AntennaSync';

// Endgame Pages
import ResultPage from './pages/ResultPage';
import VictoryPage from './pages/VictoryPage';
// HiddenResetPage removed — account deletion is handled by the admin panel
import ScanProtectedIntroRoute from './components/ScanProtectedIntroRoute';
import ScanProtectedLevelRoute from './components/ScanProtectedLevelRoute';
import ScanProtectedSynthesisRoute from './components/ScanProtectedSynthesisRoute';

function RootRedirectRoute() {
  const { loading, teamId, teamName } = useAppSession();

  if (loading) {
    return null;
  }

  const hasLoginState = Boolean(teamId && teamName?.trim());
  return <Navigate to={hasLoginState ? '/dashboard' : '/login'} replace />;
}

function LoginRoute() {
  const { loading, teamId, teamName } = useAppSession();

  if (loading) {
    return null;
  }

  const hasLoginState = Boolean(teamId && teamName?.trim());
  if (hasLoginState) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
}

function ProtectedRoute({ children }) {
  const { loading, teamId, teamName } = useAppSession();

  if (loading) {
    return null;
  }

  const hasLoginState = Boolean(teamId && teamName?.trim());
  if (!hasLoginState) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function ImpersonationBanner() {
  const { isImpersonating, teamName, teamId, stopImpersonating } = useAppSession();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  return (
    <div dir="ltr" className="relative z-50 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs px-3 py-2 flex items-center justify-between border-b border-amber-500 shadow-md">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="animate-pulse flex-shrink-0 w-2 h-2 rounded-full bg-red-400" />
        <span className="font-bold truncate">
          模擬小隊: <span className="text-amber-100 font-extrabold">{teamName || '未命名'}</span> ({teamId?.slice(0, 8)})
        </span>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="bg-white/10 hover:bg-white/20 active:scale-95 px-2 py-0.5 rounded font-bold border border-white/20 transition-all"
        >
          回後臺
        </button>
        <button
          onClick={() => {
            stopImpersonating();
            navigate('/admin/dashboard');
          }}
          className="bg-red-700 hover:bg-red-800 active:scale-95 px-2 py-0.5 rounded font-bold transition-all"
        >
          結束模擬
        </button>
      </div>
    </div>
  );
}

function App() {
  const { t } = useTranslation();
  return (
    <BrowserRouter>
      <div className="w-full min-h-screen bg-[#0D0F1A] text-white relative mx-auto max-w-md shadow-2xl overflow-hidden">
        <ImpersonationBanner />
        <Routes>
          <Route path="/" element={<RootRedirectRoute />} />
          <Route path="/login" element={<LoginRoute />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><MainDashboard /></ProtectedRoute>} />
          <Route path="/intro/:characterId" element={<ProtectedRoute><ScanProtectedIntroRoute /></ProtectedRoute>} />
          
          <Route path="/level/level1" element={<ProtectedRoute><ScanProtectedLevelRoute levelId="level1" levelTitle={t('level1.title')} characterColor="#7C5CFC"><Level1NinjaSort /></ScanProtectedLevelRoute></ProtectedRoute>} />
          <Route path="/level/level2" element={<ProtectedRoute><ScanProtectedLevelRoute levelId="level2" levelTitle={t('level2.title')} characterColor="#F472B6"><Level2SafeLock /></ScanProtectedLevelRoute></ProtectedRoute>} />
          <Route path="/level/level3" element={<ProtectedRoute><ScanProtectedLevelRoute levelId="level3" levelTitle={t('level3.title')} characterColor="#4ADE80"><Level3TapChallenge /></ScanProtectedLevelRoute></ProtectedRoute>} />
          <Route path="/level/level4" element={<ProtectedRoute><ScanProtectedLevelRoute levelId="level4" levelTitle={t('level4.title')} characterColor="#38BDF8"><Level4WaterBalloonSort /></ScanProtectedLevelRoute></ProtectedRoute>} />
          <Route path="/level/level5" element={<ProtectedRoute><ScanProtectedLevelRoute levelId="level5" levelTitle={t('level5.title')} characterColor="#FBBF24"><Level5TimeInput /></ScanProtectedLevelRoute></ProtectedRoute>} />
          <Route path="/level/level6" element={<ProtectedRoute><ScanProtectedLevelRoute levelId="level6" levelTitle={t('level6.title')} characterColor="#8B5CF6"><Level6GorillaPhoto /></ScanProtectedLevelRoute></ProtectedRoute>} />
          <Route path="/level/level7" element={<ProtectedRoute><ScanProtectedLevelRoute levelId="level7" levelTitle={t('level7.title')} characterColor="#EF4444"><Level7AntennaSync /></ScanProtectedLevelRoute></ProtectedRoute>} />
          
          <Route path="/level/:levelId" element={<ProtectedRoute><ScanProtectedLevelRoute /></ProtectedRoute>} />
          <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/synthesis" element={<ProtectedRoute><ScanProtectedSynthesisRoute /></ProtectedRoute>} />
          <Route path="/victory" element={<ProtectedRoute><VictoryPage /></ProtectedRoute>} />
          
          {/* Admin panel – secret path */}
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
