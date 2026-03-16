import React, { useEffect, useState } from 'react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  type = 'info', // 'info', 'success', 'warning', 'error'
  showCloseButton = true
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const openTimer = setTimeout(() => {
        setShouldRender(true);
        // Small delay to allow initial render before starting transition
        requestAnimationFrame(() => setIsAnimating(true));
      }, 0);
      return () => clearTimeout(openTimer);
    } else {
      const closeStartTimer = setTimeout(() => setIsAnimating(false), 0);
      const closeEndTimer = setTimeout(() => setShouldRender(false), 300);
      return () => {
        clearTimeout(closeStartTimer);
        clearTimeout(closeEndTimer);
      };
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const typeConfig = {
    info: { bg: 'bg-[#1A1D2E]', border: 'border-[#7C5CFC]', text: 'text-[#7C5CFC]' },
    success: { bg: 'bg-[#0f172a]', border: 'border-[#4ADE80]', text: 'text-[#4ADE80]' },
    warning: { bg: 'bg-[#451a03]', border: 'border-[#FBBF24]', text: 'text-[#FBBF24]' },
    error: { bg: 'bg-[#4c0519]', border: 'border-[#F472B6]', text: 'text-[#F472B6]' }
  };

  const conf = typeConfig[type] || typeConfig.info;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 pointer-events-auto">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={showCloseButton ? onClose : undefined}
      />
      
      {/* Modal Dialog */}
      <div 
        className={`relative w-full max-w-sm rounded-[2rem] border-[3px] p-5 shadow-2xl transition-all duration-300 transform 
          ${conf.bg} ${conf.border} 
          ${isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8'}
        `}
      >
        <div className="flex flex-col items-center">
          {title && (
            <h2 className={`text-xl font-bold mb-3 text-center ${conf.text} drop-shadow-md`}>
              {title}
            </h2>
          )}
          
          <div className="w-full text-center">
            {children}
          </div>

          {showCloseButton && (
            <button
              onClick={onClose}
              className={`w-full py-3 mt-5 rounded-xl font-bold text-white transition-transform active:scale-95 border-b-4 
                ${type === 'success' ? 'bg-[#22c55e] border-[#166534] hover:bg-[#16a34a]' : 
                  type === 'error' ? 'bg-[#db2777] border-[#9d174d] hover:bg-[#be185d]' : 
                  type === 'warning' ? 'bg-[#f59e0b] border-[#b45309] hover:bg-[#d97706]' :
                  'bg-[#7C5CFC] border-[#5b41c2] hover:bg-[#6b4ade]'
                }`}
            >
              確定
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
