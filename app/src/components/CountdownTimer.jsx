import React, { useState, useEffect } from 'react';

export default function CountdownTimer({ 
  initialSeconds = 60, 
  onTimeUp, 
  isRunning = false,
  format = 'MM:SS' // 'MM:SS' or 'SS'
}) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [animatePulse, setAnimatePulse] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && isRunning && onTimeUp) {
        onTimeUp();
      }
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 10) {
          // Trigger pulse animation for last 10 seconds
          setAnimatePulse(true);
          setTimeout(() => setAnimatePulse(false), 500);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning, timeLeft, onTimeUp]);

  const formatTime = () => {
    if (format === 'SS') return timeLeft.toString();
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isWarning = timeLeft <= 10;
  const isDanger = timeLeft <= 5;

  return (
    <div className={`
      force-ltr inline-flex items-center justify-center px-4 py-2 rounded-xl border-2 font-bold font-mono text-xl shadow-lg transition-colors duration-300 tracking-wider
      ${isDanger ? 'bg-red-900/50 border-red-500 text-red-100' : 
        isWarning ? 'bg-yellow-900/50 border-yellow-500 text-yellow-100' : 
        'bg-[#1A1D2E] border-[#7C5CFC]/50 text-white'}
      ${animatePulse ? 'scale-110 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] text-red-400' : 'scale-100'}
    `}>
      <span>{formatTime()}</span>
    </div>
  );
}
