import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DragDropContainer from '../components/DragDropContainer';
import Modal from '../components/Modal';
import { ingredientImages } from '../assets';
import useLevelCooldown, { formatCooldownTime } from '../hooks/useLevelCooldown';

export default function Level4WaterBalloonSort() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [slots, setSlots] = useState([]);
  const { isCoolingDown, remainingMs, triggerCooldown } = useLevelCooldown('level4');

  // Available water balloons
  const items = [
    { id: 'red', content: '🔴', color: '#EF4444' },
    { id: 'blue', content: '🔵', color: '#3B82F6' },
    { id: 'yellow', content: '🟡', color: '#EAB308' },
    { id: 'green', content: '🟢', color: '#22C55E' }
  ];

  const handleSubmit = () => {
    if (isCoolingDown) return;

    const allFilled = slots.length === 4 && slots.every((slot) => slot !== null);
    if (!allFilled) return;

    // 答案邏輯推導：綠 > 藍 > 黃 > 紅
    const correctSequence = ['green', 'blue', 'yellow', 'red'];
    const currentSequence = slots.map(slot => slot?.id);
    
    let isCorrect = true;
    for (let i = 0; i < 4; i++) {
      if (currentSequence[i] !== correctSequence[i]) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      setTimeout(() => setShowSuccess(true), 500);
    } else {
      triggerCooldown();
      setTimeout(() => setShowError(true), 500);
    }
  };

  const currentLevelColor = "#38BDF8";

  return (
    <div className="w-full flex-1 flex flex-col justify-center animate-in slide-in-from-bottom duration-500">
      
      <div className="bg-[#1A1D2E]/80 backdrop-blur-md p-6 rounded-[2rem] border-2 shadow-2xl mb-8 overflow-y-auto max-h-[70vh]" style={{ borderColor: `${currentLevelColor}50` }}>
        
        <div className="bg-[#0D0F1A] border-l-4 border-[#38BDF8] p-4 rounded-r-xl mb-6 shadow-md text-sm text-gray-200">
          <p className="font-bold text-[#38BDF8] mb-2">🎈 水球重量邏輯題：</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><span className="text-blue-400 font-bold">藍色水球</span>不是最重的，也不是最輕的。</li>
            <li><span className="text-green-400 font-bold">綠色水球</span>比<span className="text-red-400 font-bold">紅色水球</span>重。</li>
            <li><span className="text-yellow-400 font-bold">黃色水球</span>比<span className="text-blue-400 font-bold">藍色水球</span>輕，但它『不是』最輕的。</li>
          </ol>
          <p className="mt-2 text-white font-bold">請問從最重到最輕的正確順序是什麼？</p>
        </div>
        
        <DragDropContainer 
          items={items} 
          slotsCount={4} 
          onChange={setSlots}
        />
        
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isCoolingDown}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#38BDF8] to-[#0284c7] border-b-4 border-[#0369a1] active:border-b-0 active:translate-y-1 font-bold shadow-lg text-white"
          >
            送出答案避開炸彈！ 🛡️
          </button>
        </div>
      </div>

      <Modal 
        isOpen={showSuccess && !isCoolingDown} 
        onClose={() => navigate('/dashboard')}
        title="邏輯滿分"
        type="success"
      >
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 mb-4 rounded-2xl bg-[#0B1224] border border-white/20 p-2 shadow-[0_0_20px_rgba(251,191,36,0.45)]">
            <img src={ingredientImages.richParmesanCheese} alt="濃郁帕瑪森起司" className="w-full h-full object-cover rounded-xl" />
          </div>
          <p className="text-white font-bold mb-2">獲得：濃郁帕瑪森起司！</p>
          <div className="bg-[#166534] text-green-100 p-3 rounded-xl border border-green-500 text-sm w-full">
            💡 線索：「大象仙人掌因為沒有 Wi-Fi 在沙漠裡迷路了。」
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showError} 
        onClose={() => { setShowError(false); navigate('/dashboard'); }}
        title="被水球砸中，進入冷卻"
        type="error"
        showCloseButton={true}
      >
        <div className="text-center">
          <p className="text-6xl mb-4">💦</p>
          <p className="text-white">順序不對！轟炸鱷鱷嘲笑著對你丟了一顆巨大水球！</p>
          <p className="text-sm text-pink-200 mt-2">冷卻時間：{formatCooldownTime(remainingMs)}</p>
        </div>
      </Modal>

      <Modal
        isOpen={isCoolingDown && !showError}
        onClose={() => navigate('/dashboard')}
        title="關卡冷卻中"
        type="warning"
        showCloseButton={true}
      >
        <p className="text-white">此關暫時不能重試，先去幫其他角色解謎吧。</p>
        <p className="text-[#FBBF24] font-bold mt-2">剩餘時間：{formatCooldownTime(remainingMs)}</p>
      </Modal>

    </div>
  );
}
