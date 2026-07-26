import React from 'react';
import { Delete } from 'lucide-react';

export default function NumericKeypad({ onKeyPress, onDelete, onSubmit, maxLength = 4, currentValue = '' }) {
  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'C', '0', '✓'
  ];

  const handleKeyPress = (key) => {
    if (key === 'C') {
      if (onDelete) onDelete();
    } else if (key === '✓') {
      if (onSubmit) onSubmit();
    } else {
      if (onKeyPress) onKeyPress(key);
    }
  };

  return (
    <div className="w-full max-w-[280px] mx-auto bg-[#0D0F1A]/80 p-4 rounded-3xl border border-white/10 shadow-xl backdrop-blur-sm">
      {/* force-ltr keeps 1-2-3 reading left-to-right; a mirrored keypad is unusable. */}
      <div className="force-ltr grid grid-cols-3 gap-3">
        {keys.map((key) => {
          const isNum = !['C', '✓'].includes(key);
          const isSubmit = key === '✓';
          const isClear = key === 'C';
          
          let btnClass = "relative flex items-center justify-center h-14 rounded-2xl text-2xl font-bold transition-all duration-150 transform active:scale-95 touch-manipulation ";
          
          if (isNum) {
            btnClass += "bg-[#1A1D2E] text-white border-b-4 border-[#0D0F1A] hover:bg-[#2D314A] shadow-[0_4px_0_rgba(0,0,0,0.5)]";
          } else if (isSubmit) {
            const isReady = currentValue.length >= maxLength;
            btnClass += isReady 
              ? "bg-[#4ADE80] text-black border-b-4 border-[#22c55e] shadow-[0_4px_0_#166534] shadow-[0_0_15px_rgba(74,222,128,0.5)]" 
              : "bg-gray-700 text-gray-400 border-b-4 border-gray-900 pointer-events-none opacity-50";
          } else if (isClear) {
            btnClass += "bg-[#F472B6] text-white border-b-4 border-[#be185d] hover:bg-[#db2777] shadow-[0_4px_0_#831843]";
          }

          return (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className={btnClass}
            >
              {key === 'C' ? <Delete size={24} /> : key === '✓' ? 'OK' : key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
