import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NumericKeypad from '../components/NumericKeypad';
import Modal from '../components/Modal';
import { ingredientImages } from '../assets';
import useLevelCooldown, { formatCooldownTime } from '../hooks/useLevelCooldown';

export default function Level2SafeLock() {
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const { isCoolingDown, remainingMs, triggerCooldown } = useLevelCooldown('level2');

  const handleKeyPress = (key) => {
    if (passcode.length < 4) {
      setPasscode(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (isCoolingDown) return;

    // For demo, any 4 digits work, or specifically "1234"
    if (passcode.length === 4) {
      if (passcode === '1234') {
        setShowSuccess(true);
      } else {
        triggerCooldown();
        setShowError(true);
        setPasscode(''); // Reset on fail
      }
    }
  };

  const currentLevelColor = "#F472B6";

  return (
    <div className="w-full flex-1 flex flex-col justify-center animate-in slide-in-from-bottom duration-500">
      
      <div className="bg-[#1A1D2E]/80 backdrop-blur-md p-6 rounded-[2rem] border-2 shadow-2xl mb-8" style={{ borderColor: `${currentLevelColor}50` }}>
        <h2 className="text-[#FBBF24] font-bold text-xl text-center mb-2">舞鞋保險箱</h2>
        <p className="text-gray-300 text-sm text-center mb-8">
          犯人留下了線索，舞鞋被藏在「有著三棵紅色植物與兩張長椅交界處」，密碼在那裡！
        </p>
        
        {/* Passcode Display */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index}
              className={`w-14 h-16 rounded-xl flex items-center justify-center text-3xl font-bold border-b-4 transition-all duration-300
                ${passcode.length > index 
                  ? 'bg-white text-gray-900 border-gray-300 scale-110 shadow-lg' 
                  : 'bg-gray-800 text-gray-500 border-gray-900'}
              `}
            >
              {passcode[index] ? passcode[index] : '*'}
            </div>
          ))}
        </div>

        <NumericKeypad 
          onKeyPress={handleKeyPress}
          onDelete={handleDelete}
          onSubmit={handleSubmit}
          currentValue={passcode}
        />
      </div>

      {/* Success Modal */}
      <Modal 
        isOpen={showSuccess && !isCoolingDown} 
        onClose={() => navigate('/dashboard')}
        title="保險箱已解開"
        type="success"
      >
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 mb-4 rounded-2xl bg-[#0B1224] border border-white/20 p-2 shadow-[0_0_20px_rgba(239,68,68,0.45)]">
            <img src={ingredientImages.holyTomato} alt="神聖番茄" className="w-full h-full object-cover rounded-xl" />
          </div>
          <p className="text-white font-bold mb-2">獲得：神聖番茄！</p>
          <div className="bg-[#166534] text-green-100 p-3 rounded-xl border border-green-500 text-sm w-full">
            💡 線索：「聽說大腳怪猴子頭上有一隻青蛙。」
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal 
        isOpen={showError} 
        onClose={() => { setShowError(false); navigate('/dashboard'); }}
        title="密碼錯誤，進入冷卻"
        type="error"
        showCloseButton={true}
      >
        <p className="text-white">這不是存放舞鞋的密碼！先去找找線索再回來。</p>
        <p className="text-sm text-pink-200 mt-2">冷卻時間：{formatCooldownTime(remainingMs)}</p>
      </Modal>

      <Modal
        isOpen={isCoolingDown && !showError}
        onClose={() => navigate('/dashboard')}
        title="關卡冷卻中"
        type="warning"
        showCloseButton={true}
      >
        <p className="text-white">這關目前不能重試，請先去其他地方探索。</p>
        <p className="text-[#FBBF24] font-bold mt-2">剩餘時間：{formatCooldownTime(remainingMs)}</p>
      </Modal>

    </div>
  );
}
