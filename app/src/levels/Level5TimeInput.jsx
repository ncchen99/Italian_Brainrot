import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NumericKeypad from '../components/NumericKeypad';
import Modal from '../components/Modal';
import { ingredientImages, uiImages } from '../assets';
import useLevelCooldown, { formatCooldownTime } from '../hooks/useLevelCooldown';

export default function Level5TimeInput() {
  const navigate = useNavigate();
  const [timeInput, setTimeInput] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const { isCoolingDown, remainingMs, triggerCooldown } = useLevelCooldown('level5');

  const prevLocks = ["01:15", "02:30", "04:00", "05:45"];
  const correctTime = "0745"; // 07:45

  const handleKeyPress = (key) => {
    if (timeInput.length < 4) {
      setTimeInput(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setTimeInput(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (isCoolingDown) return;

    if (timeInput === correctTime) {
      setShowSuccess(true);
    } else {
      triggerCooldown();
      setShowError(true);
      setTimeInput('');
    }
  };

  // Format input as HH:MM
  const formatDisplay = () => {
    const padded = timeInput.padEnd(4, '_');
    return `${padded.slice(0,2)}:${padded.slice(2,4)}`;
  };

  const currentLevelColor = "#FBBF24";

  return (
    <div className="w-full flex-1 flex flex-col justify-center animate-in slide-in-from-bottom duration-500">
      
      <div className="bg-[#1A1D2E]/80 backdrop-blur-md p-6 rounded-[2rem] border-2 shadow-2xl mb-8" style={{ borderColor: `${currentLevelColor}50` }}>
        
        <div className="bg-[#0D0F1A] border-l-4 border-[#FBBF24] p-4 rounded-r-xl mb-6 shadow-md text-sm text-gray-200">
          <p className="font-bold text-[#FBBF24] mb-2">⏳ 鬧鐘數列解謎：</p>
          <p className="mb-2">前四道鎖顯示的時間：</p>
          <div className="flex justify-between px-2 text-[#4ADE80] font-mono text-lg font-bold mb-4 drop-shadow-md">
            {prevLocks.map((t, i) => <span key={i}>{t}</span>)}
          </div>
          <p className="text-white font-bold">請問「第五道鎖」應該輸入幾點幾分才能完全解開？</p>
        </div>
        
        {/* Time Input Display */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <div className="bg-gray-900 border-2 border-gray-600 rounded-xl px-6 py-4 text-4xl font-mono text-white tracking-widest shadow-inner">
            {formatDisplay()}
          </div>
        </div>

        <NumericKeypad 
          onKeyPress={handleKeyPress}
          onDelete={handleDelete}
          onSubmit={handleSubmit}
          currentValue={timeInput}
          maxLength={4}
        />
      </div>

      <Modal 
        isOpen={showSuccess && !isCoolingDown} 
        onClose={() => navigate('/dashboard')}
        title="鬧鐘重啟成功"
        type="success"
      >
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 mb-4 rounded-2xl bg-[#0B1224] border border-white/20 p-2 shadow-[0_0_20px_rgba(74,222,128,0.45)]">
            <img src={ingredientImages.magicBasilLeaf} alt="魔法羅勒葉" className="w-full h-full object-cover rounded-xl" />
          </div>
          <p className="text-white font-bold mb-2">獲得：魔法羅勒葉！</p>
          <div className="bg-[#166534] text-green-100 p-3 rounded-xl border border-green-500 text-sm w-full mb-2">
            <span className="inline-flex items-center gap-2">
              <img src={uiImages.wifiFragments} alt="藍色天線碎片" className="w-5 h-5 object-contain" />
              你獲得了一半的通訊密碼與藍色天線碎片！
            </span>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showError} 
        onClose={() => { setShowError(false); navigate('/dashboard'); }}
        title="密碼錯誤，進入冷卻"
        type="error"
        showCloseButton={true}
      >
        <p className="text-white">鬧鐘發出嗶嗶聲並鎖死了！請稍後再試。</p>
        <p className="text-sm text-pink-200 mt-2">冷卻時間：{formatCooldownTime(remainingMs)}</p>
      </Modal>

      <Modal
        isOpen={isCoolingDown && !showError}
        onClose={() => navigate('/dashboard')}
        title="關卡冷卻中"
        type="warning"
        showCloseButton={true}
      >
        <p className="text-white">你剛剛答錯了，請先去其他關卡探索。</p>
        <p className="text-[#FBBF24] font-bold mt-2">剩餘時間：{formatCooldownTime(remainingMs)}</p>
      </Modal>

    </div>
  );
}
