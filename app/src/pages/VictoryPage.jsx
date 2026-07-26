import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uiImages } from '../assets';
import { useTranslation } from 'react-i18next';
import { useAppSession } from '../contexts/AppSessionContext';

export default function VictoryPage() {
  const navigate = useNavigate();
  const [showCert, setShowCert] = useState(false);
  const certRef = useRef();
  const { t } = useTranslation();
  const { teamName } = useAppSession();

  useEffect(() => {
    // Reveal certificate with slight delay
    setTimeout(() => setShowCert(true), 800);
  }, []);

  const handleDownload = () => {
    // In real app: use html2canvas or similar to save certRef.current
    alert(t('victory.downloadAlert'));
  };

  return (
    <div className="w-full min-h-[100dvh] flex flex-col items-center bg-[#0D0F1A] py-12 px-6 relative overflow-y-auto overflow-x-hidden">
      
      {/* Confetti Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
         {Array.from({ length: 50 }).map((_, i) => {
           const colors = ['bg-[#FBBF24]', 'bg-[#F472B6]', 'bg-[#4ADE80]', 'bg-[#38BDF8]', 'bg-[#7C5CFC]'];
           const color = colors[Math.floor(Math.random() * colors.length)];
           return (
             <div 
               key={i}
               className={`absolute w-2 h-4 rounded-sm ${color} animate-drop`}
               style={{
                 left: `${Math.random() * 100}%`,
                 top: `-10%`,
                 animationDelay: `${Math.random() * 5}s`,
                 animationDuration: `${Math.random() * 3 + 2}s`,
                 transform: `rotate(${Math.random() * 360}deg)`
               }}
             />
           );
         })}
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FBBF24] to-[#f59e0b] mb-2 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] mt-4 text-center">
          {t('victory.worldSaved')}
        </h1>
        <p className="text-gray-300 font-bold mb-8 text-center bg-black/50 px-4 py-1 rounded-full border border-white/10 backdrop-blur-md">
          {t('victory.subtitle')}
        </p>

        {/* Certificate Card */}
        <div 
          ref={certRef}
          className={`w-full bg-[#1A1D2E] rounded-[2rem] border-4 border-[#FBBF24] p-6 shadow-[0_0_40px_rgba(251,191,36,0.3)] flex flex-col items-center relative transition-all duration-1000 transform origin-bottom
            ${showCert ? 'opacity-100 translate-y-0 rotate-0 scale-100' : 'opacity-0 translate-y-32 rotate-[-5deg] scale-90'}
          `}
        >
           {/* Ribbon Decor */}
           <div className="absolute -top-6 bg-[#EF4444] text-white px-6 py-2 rounded-t-xl font-bold border-2 border-red-800 shadow-md">
             {t('victory.certTitle')}
           </div>
           
           <div className="w-full flex justify-between items-start mt-4 mb-6">
             <img src={uiImages.ultimatePizza} alt={t('synthesis.pizzaName')} className="w-16 h-16 object-contain drop-shadow-md" />
             <div className="text-end">
                <div className="text-xs text-gray-400 font-bold mb-1">{t('victory.certNumber')}</div>
                <div className="text-[#38BDF8] font-mono">PIZZA-001</div>
             </div>
           </div>

           <h2 className="text-[#FBBF24] text-xl font-bold mb-4 w-full border-b border-gray-700 pb-2">{teamName || t('dashboard.meta.unnamedTeam')}</h2>
           
           <div className="w-full space-y-3 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('victory.timeLabel')}</span>
                <span className="text-white font-mono font-bold">{t('victory.timeValue')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('victory.ingredientsLabel')}</span>
                <span className="text-[#4ADE80] font-bold">{t('victory.perfectClear')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('victory.intelLabel')}</span>
                <span className="text-[#F472B6] font-bold">{t('victory.sssRating')}</span>
              </div>
           </div>
           
           <div className="text-xs text-center text-gray-500 font-bold border-t border-gray-800 pt-4 w-full">
             {t('victory.certFooter1')}<br/>{t('victory.certFooter2')}
           </div>
        </div>

        <div className={`w-full mt-10 space-y-4 transition-all duration-500 delay-1000 ${showCert ? 'opacity-100' : 'opacity-0'}`}>
          <button 
             onClick={handleDownload}
             className="w-full py-4 rounded-xl font-bold text-white bg-[#38BDF8] border-b-4 border-[#0284c7] active:border-b-0 active:translate-y-1 shadow-lg"
          >
             {t('victory.saveBtn')}
          </button>
          
          <button 
             onClick={() => navigate('/login')}
             className="w-full py-4 rounded-xl font-bold text-gray-400 bg-gray-900 border border-gray-700 hover:text-white transition-colors"
          >
             {t('victory.homeBtn')}
          </button>
        </div>

      </div>

    </div>
  );
}
