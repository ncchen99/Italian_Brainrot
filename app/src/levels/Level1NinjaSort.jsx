import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DragDropContainer from '../components/DragDropContainer';
import Modal from '../components/Modal';
import { ingredientImages } from '../assets';
import useLevelCooldown, { formatCooldownTime } from '../hooks/useLevelCooldown';

export default function Level1NinjaSort() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [slots, setSlots] = useState([]);
  const { isCoolingDown, remainingMs, triggerCooldown } = useLevelCooldown('level1');

  // Available ninjutsu signs
  const items = [
    { id: 'coffee', content: '咖', color: '#7C5CFC' },
    { id: 'fire', content: '火', color: '#EF4444' },
    { id: 'sword', content: '刀', color: '#FBBF24' }
  ];

  const handleSubmit = () => {
    const allFilled = slots.length === 3 && slots.every(slot => slot !== null);
    if (!allFilled) return;

    // 正確順序為 3-1-2 => 刀、咖、火
    const correctSequence = ['sword', 'coffee', 'fire'];
    const currentSequence = slots.map((slot) => slot.id);
    const isCorrect = currentSequence.every((id, index) => id === correctSequence[index]);

    if (isCorrect) {
      setTimeout(() => setShowSuccess(true), 300);
    } else {
      triggerCooldown();
      setShowError(true);
    }
  };

  const currentLevelColor = "#7C5CFC";

  return (
    <div className="w-full flex-1 flex flex-col justify-center animate-in slide-in-from-bottom duration-500">
      
      <div className="bg-[#1A1D2E]/80 backdrop-blur-md p-6 rounded-[2rem] border-2 shadow-2xl mb-8" style={{ borderColor: `${currentLevelColor}50` }}>
        <h2 className="text-[#FBBF24] font-bold text-xl text-center mb-2">忍者的修煉</h2>
        <p className="text-gray-300 text-sm text-center mb-6">
          幫助卡布奇諾忍者排回正確的結印順序！<br />提示數字藏在校園周圍。
        </p>
        
        <DragDropContainer 
          items={items} 
          slotsCount={3} 
          onChange={setSlots}
        />
        
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isCoolingDown}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#7C5CFC] to-[#5b41c2] border-b-4 border-[#3b2786] active:border-b-0 active:translate-y-1 font-bold shadow-lg text-white"
          >
            發動忍術！
          </button>
        </div>
      </div>

      <Modal 
        isOpen={showSuccess && !isCoolingDown} 
        onClose={() => navigate('/dashboard')}
        title="挑戰成功"
        type="success"
      >
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 mb-4 rounded-2xl bg-[#0B1224] border border-white/20 p-2 shadow-[0_0_20px_rgba(253,224,71,0.45)]">
            <img src={ingredientImages.premiumFlour} alt="陳年特級麵粉" className="w-full h-full object-cover rounded-xl" />
          </div>
          <p className="text-white font-bold mb-2">獲得：陳年特級麵粉！</p>
          <div className="bg-[#166534] text-green-100 p-3 rounded-xl border border-green-500 text-sm w-full">
            💡 線索：「水球鱷魚知道起司在哪裡。」
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showError} 
        onClose={() => { setShowError(false); navigate('/dashboard'); }}
        title="結印失敗"
        type="error"
        showCloseButton={true}
      >
        <p className="text-white">忍術順序錯誤，卡布奇諾忍者叫你先冷靜一下！</p>
        <p className="text-sm text-pink-200 mt-2">冷卻時間：{formatCooldownTime(remainingMs)}</p>
      </Modal>

      <Modal
        isOpen={isCoolingDown && !showError}
        onClose={() => navigate('/dashboard')}
        title="關卡冷卻中"
        type="warning"
        showCloseButton={true}
      >
        <p className="text-white">你剛剛挑戰失敗，這關暫時鎖定。</p>
        <p className="text-[#FBBF24] font-bold mt-2">剩餘時間：{formatCooldownTime(remainingMs)}</p>
      </Modal>

    </div>
  );
}
