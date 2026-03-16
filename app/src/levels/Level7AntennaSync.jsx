import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NumericKeypad from '../components/NumericKeypad';
import Modal from '../components/Modal';
import { uiImages } from '../assets';

export default function Level7AntennaSync() {
  const navigate = useNavigate();
  const [syncCode, setSyncCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  
  // Randomly assign team A or B (Red or Blue antenna)
  const [teamColor] = useState(() => (Math.random() > 0.5 ? 'red' : 'blue'));

  const handleKeyPress = (key) => {
    if (syncCode.length < 6) {
      setSyncCode(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setSyncCode(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    // Demo correct code 888888
    if (syncCode === '888888') {
      setShowSuccess(true);
    } else {
      setShowError(true);
      setSyncCode('');
    }
  };

  const formatDisplay = () => {
    const padded = syncCode.padEnd(6, '_');
    return `${padded.slice(0,3)} - ${padded.slice(3,6)}`;
  };

  const currentLevelColor = "#EF4444";
  const myColorHex = teamColor === 'red' ? '#EF4444' : '#3B82F6';
  const myColorName = teamColor === 'red' ? '紅色' : '藍色';
  const partnerColorName = teamColor === 'red' ? '藍色' : '紅色';
  const myCodePart = teamColor === 'red' ? '888' : '888'; // Simplify for demo

  return (
    <div className="w-full flex-1 flex flex-col justify-center animate-in slide-in-from-bottom duration-500">
      
      <div className="bg-[#1A1D2E]/80 backdrop-blur-md p-6 rounded-[2rem] border-2 shadow-2xl mb-8" style={{ borderColor: `${currentLevelColor}50` }}>
        
        <h2 className="text-[#FBBF24] font-bold text-xl text-center mb-4">潮鞋防衛戰（雙人合作）</h2>
        
        <div className="flex flex-col items-center mb-6">
           <div className="text-sm text-gray-400 mb-1">你的天線裝置</div>
           <div 
             className="w-16 h-16 rounded-full flex items-center justify-center text-2xl border-4 animate-pulse mb-2 shadow-[0_0_15px_currentColor]"
             style={{ borderColor: myColorHex, color: myColorHex }}
           >
             <img src={uiImages.wifiFragments} alt="Antenna" className="w-9 h-9 object-contain" />
           </div>
           <div className="font-bold text-lg" style={{ color: myColorHex }}>
             {myColorName}訊號
           </div>
        </div>

        <div className="bg-[#0D0F1A] border-l-4 p-4 rounded-r-xl mb-6 shadow-md text-sm text-gray-200" style={{ borderColor: myColorHex }}>
          <p className="mb-2">1. 請尋找擁有<span className="font-bold">{partnerColorName}天線</span>的友隊</p>
          <p className="mb-2">2. 你的密碼片段是：<span className="text-2xl font-mono block text-center my-2 font-bold tracking-widest">{myCodePart} _ _ _</span></p>
          <p>3. 交換情報，組成完整的 6 碼！</p>
        </div>
        
        {/* Passcode Display */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-900 border-2 border-gray-600 rounded-xl px-4 py-3 text-3xl font-mono text-white tracking-widest shadow-inner text-center w-full max-w-[280px]">
            {formatDisplay()}
          </div>
        </div>

        <NumericKeypad 
          onKeyPress={handleKeyPress}
          onDelete={handleDelete}
          onSubmit={handleSubmit}
          currentValue={syncCode}
          maxLength={6}
        />
      </div>

      <Modal 
        isOpen={showSuccess} 
        onClose={() => navigate('/synthesis')}
        title="防護罩破解成功"
        type="success"
      >
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 mb-4 rounded-2xl bg-[#0B1224] border border-white/20 p-2 shadow-[0_0_20px_rgba(124,92,252,0.45)]">
            <img src={uiImages.wifiFragments} alt="Wi-Fi 權限" className="w-full h-full object-cover rounded-xl" />
          </div>
          <p className="text-white font-bold mb-2">啦啦鯊成功揍扁了魔王！</p>
          <div className="bg-[#166534] text-green-100 p-3 rounded-xl border border-green-500 text-sm w-full font-bold">
            獲得完整 Wi-Fi 權限！<br/>快前往「合成協作站」完成材料加工！
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showError} 
        onClose={() => setShowError(false)}
        title="通訊失敗"
        type="error"
        showCloseButton={true}
      >
        <p className="text-white">防護罩依然堅固！請跟友隊確認密碼順序是否正確！</p>
      </Modal>

    </div>
  );
}
