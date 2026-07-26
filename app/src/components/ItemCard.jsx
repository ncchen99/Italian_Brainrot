import React, { useState } from 'react';
import { uiImages } from '../assets';

export default function ItemCard({ 
  imageSrc, 
  title, 
  description, 
  isCollected = true,
  glowColor = '#FBBF24',
  onClick 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
    if (onClick) onClick();
  };

  if (!isCollected) {
    return (
      <div className="aspect-square bg-[#1A1D2E]/75 rounded-2xl border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden">
        {imageSrc ? (
          <img src={imageSrc} alt="Locked" className="w-full h-full object-cover grayscale opacity-40 blur-[1.5px]" />
        ) : (
          <div className="w-full h-full bg-gray-700/30" />
        )}
      </div>
    );
  }

  return (
    <button 
      onClick={handleClick}
      className={`relative rounded-2xl border-2 transition-all duration-300 transform text-start overflow-hidden
        ${isExpanded ? 'col-span-2 scale-[1.01] z-10 min-h-[156px]' : 'aspect-square hover:scale-105'}
        ${isCollected ? 'bg-[#151A30]/90 border-[#7C5CFC] shadow-[0_0_20px_rgba(124,92,252,0.25)]' : ''}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#120E27]/75 via-transparent to-transparent pointer-events-none"></div>

      <div
        className={`absolute transition-all duration-300 rounded-xl overflow-hidden ${isExpanded ? 'start-3 top-3 bottom-3 w-24' : 'inset-0'}`}
        style={{ boxShadow: `0 0 22px ${glowColor}88` }}
      >
        {imageSrc ? (
          <img src={imageSrc} alt={title} className="w-full h-full object-cover" />
        ) : (
          <img src={uiImages.logo} alt="Item placeholder" className="w-full h-full object-contain opacity-70" />
        )}
      </div>

      <div className={`relative z-10 flex flex-col h-full p-3 ${isExpanded ? 'ms-28 justify-start pt-4 pb-4 pe-4' : 'justify-end'}`}>
        <h3 className={`font-bold text-[#FBBF24] drop-shadow-sm inline-block ${isExpanded ? 'text-lg text-start' : 'text-sm text-center self-center bg-black/35 backdrop-blur-sm px-2 py-1 rounded-lg'}`}>
          {title}
        </h3>

        {isExpanded && description && (
          <p className="text-xs text-gray-200 mt-2 text-start leading-relaxed animate-in fade-in duration-300">
            {description}
          </p>
        )}
      </div>
    </button>
  );
}
