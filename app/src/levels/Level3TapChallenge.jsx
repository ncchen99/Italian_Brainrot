import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CountdownTimer from '../components/CountdownTimer';
import Modal from '../components/Modal';
import { ingredientImages, characterAssets, sfx } from '../assets';
import useLevelCooldown, { formatCooldownTime } from '../hooks/useLevelCooldown';
import { useAppSession } from '../contexts/AppSessionContext';
import { saveLevelProgress } from '../services/progressService';
import { useTranslation } from 'react-i18next';

export default function Level3TapChallenge() {
  const navigate = useNavigate();
  const [taps, setTaps] = useState(0);
  const [gameStatus, setGameStatus] = useState('ready'); // 'ready', 'playing', 'won', 'lost'
  const inflateAudioRef = useRef(null);
  const popAudioRef = useRef(null);
  const { isCoolingDown, remainingMs, triggerCooldown } = useLevelCooldown('level3');
  const { teamId, activeChallenge } = useAppSession();
  const { t } = useTranslation();
  
  const targetTaps = 50;
  const currentLevelColor = "#4ADE80";

  useEffect(() => {
    inflateAudioRef.current = new Audio(sfx.balloonInflate);
    popAudioRef.current = new Audio(sfx.balloonPop);
    inflateAudioRef.current.volume = 0.35;
    popAudioRef.current.volume = 0.6;
  }, []);

  useEffect(() => {
    if (gameStatus === 'won' && popAudioRef.current) {
      popAudioRef.current.currentTime = 0;
      popAudioRef.current.play().catch(() => {});
    }
  }, [gameStatus]);

  const handleTap = () => {
    if (isCoolingDown) return;

    if (gameStatus === 'ready') {
      setGameStatus('playing');
    }
    
    if (gameStatus === 'playing' || gameStatus === 'ready') {
      if (inflateAudioRef.current) {
        inflateAudioRef.current.currentTime = 0;
        inflateAudioRef.current.play().catch(() => {});
      }
      setTaps(prev => {
        const newTaps = prev + 1;
        if (newTaps >= targetTaps) {
          if (teamId) {
            saveLevelProgress({
              teamId,
              sessionId: activeChallenge?.id || null,
              levelId: 'level3',
              status: 'completed'
            }).catch(() => {});
          }
          setGameStatus('won');
        }
        return newTaps;
      });
    }
  };

  const handleTimeUp = useCallback(() => {
    setGameStatus(prevStatus => {
      if (prevStatus === 'playing') {
        if (teamId) {
          saveLevelProgress({
            teamId,
            sessionId: activeChallenge?.id || null,
            levelId: 'level3',
            status: 'failed'
          }).catch(() => {});
        }
        triggerCooldown();
        return 'lost';
      }
      return prevStatus;
    });
  }, [activeChallenge?.id, teamId, triggerCooldown]);

  const progressPercentage = Math.min((taps / targetTaps) * 100, 100);

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center animate-in slide-in-from-bottom duration-500">
      
      <div className="w-full bg-[#1A1D2E]/80 backdrop-blur-md p-6 rounded-[2rem] border-2 shadow-2xl mb-8 flex flex-col items-center" style={{ borderColor: `${currentLevelColor}50` }}>
        
        <div className="flex justify-between w-full items-center mb-6">
          <h2 className="text-[#FBBF24] font-bold text-xl">{t('level3.title')}</h2>
          <div className="flex flex-col items-end">
             {gameStatus === 'ready' && <div className="text-gray-400 font-bold border-2 border-gray-600 px-4 py-2 rounded-xl">{t('level3.readyCount')}</div>}
             {gameStatus === 'playing' && <CountdownTimer initialSeconds={10} isRunning={true} onTimeUp={handleTimeUp} format="SS" />}
          </div>
        </div>
        
        <p className="text-gray-300 text-sm text-center mb-8">
          {t('level3.desc')}
        </p>
        
        {/* The Giant Balloon Button */}
        <button 
          onClick={handleTap}
          className={`relative group touch-manipulation transition-transform duration-75 active:scale-95
            ${gameStatus === 'won' ? 'hidden' : 'block'}
          `}
          style={{ width: `${150 + (taps * 2)}px`, height: `${150 + (taps * 2)}px`, maxWidth: '280px', maxHeight: '280px' }}
        >
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-40 group-active:opacity-80 transition-opacity"></div>
          <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-[#38BDF8] rounded-full shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.3)] shadow-[0_10px_20px_rgba(56,189,248,0.5)] border-4 border-white/20 flex flex-col items-center justify-center overflow-hidden">
             
             {/* The annoying frog that is stuck inside */}
             <img src={characterAssets.level3.image} alt="Patapim" className="w-16 h-16 absolute animate-bounce object-contain" style={{ top: '18%' }} />
             
             <span className="text-white font-black text-2xl z-10 drop-shadow-md mt-6">{t('level3.tapHere')}</span>
          </div>
        </button>
        
        {/* Progress Bar */}
        <div className="w-full mt-8">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-gray-400">{t('level3.progress')}</span>
            <span className="force-ltr text-[#4ADE80]">{taps} / {targetTaps}</span>
          </div>
          <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
            <div 
              className="h-full bg-gradient-to-r from-[#4ADE80] to-[#22c55e] transition-all duration-100 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

      </div>

      <Modal 
        isOpen={gameStatus === 'won' && !isCoolingDown} 
        onClose={() => navigate('/dashboard')}
        title={t('level3.successTitle')}
        type="success"
      >
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 mb-4 rounded-2xl bg-[#0B1224] border border-white/20 p-2 shadow-[0_0_20px_rgba(56,189,248,0.45)]">
            <img src={ingredientImages.pureSpringWater} alt="Pure Spring Water" className="w-full h-full object-cover rounded-xl" />
          </div>
          <p className="text-white font-bold mb-2">{t('level3.obtained')}</p>
          <div className="bg-[#166534] text-green-100 p-3 rounded-xl border border-green-500 text-sm w-full">
            {t('level3.clue')}
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={gameStatus === 'lost'} 
        onClose={() => { setGameStatus('ready'); setTaps(0); navigate('/dashboard'); }}
        title={t('level3.failTitle')}
        type="error"
        showCloseButton={true}
      >
        <div className="text-center">
          <p className="text-6xl mb-4">😮‍💨</p>
          <p className="text-white">{t('level3.failMsg')}</p>
          <p className="text-sm text-pink-200 mt-2">{t('level3.cooldownTime')} {formatCooldownTime(remainingMs)}</p>
        </div>
      </Modal>

      <Modal
        isOpen={isCoolingDown && gameStatus !== 'lost'}
        onClose={() => navigate('/dashboard')}
        title={t('level3.cooldownTitle')}
        type="warning"
        showCloseButton={true}
      >
        <p className="text-white">{t('level3.cooldownMsg')}</p>
        <p className="text-[#FBBF24] font-bold mt-2">{t('level3.remTime')} {formatCooldownTime(remainingMs)}</p>
      </Modal>

    </div>
  );
}
