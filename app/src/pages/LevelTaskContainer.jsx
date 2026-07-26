import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { uiImages } from '../assets';
import { useTranslation } from 'react-i18next';

export default function LevelTaskContainer({ children, levelTitle, characterColor = "#7C5CFC" }) {
  const navigate = useNavigate();
  // If no props passed (used as direct route component), we can extract from params
  const { levelId } = useParams();
  const { t } = useTranslation();
  
  const displayTitle = levelTitle || t('levelContainer.defaultTitle', { levelNum: levelId?.replace('level', '') || '?' });

  return (
    <div className="w-full min-h-[100dvh] flex flex-col bg-[#0D0F1A] pb-8 overflow-x-hidden">
      
      {/* Header Bar */}
      <div 
        className="w-full pt-8 pb-4 px-4 flex items-center shadow-lg rounded-b-3xl mb-6 relative z-10 border-b border-white/10"
        style={{ backgroundColor: `${characterColor}30` }}
      >
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur-md border border-white/20 active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} className="rtl:rotate-180" />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-white drop-shadow-md pe-10">
          {displayTitle}
        </h1>
      </div>

      {/* Task Content Area */}
      <div className="flex-1 w-full max-w-sm mx-auto px-4 flex flex-col relative z-0">
        
        {/* Children components (Specific Level UIs) will be injected here */}
        {children ? children : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 animate-pulse">
            <img src={uiImages.logo} alt={t('levelContainer.underConstructionAlt')} className="w-16 h-16 mb-4 object-contain opacity-60" />
            <p>{t('levelContainer.underConstructionText', { levelId })}</p>
          </div>
        )}

      </div>
      
    </div>
  );
}
