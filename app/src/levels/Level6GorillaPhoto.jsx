import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import Modal from '../components/Modal';
import { characterAssets } from '../assets';
import useLevelCooldown, { formatCooldownTime } from '../hooks/useLevelCooldown';

export default function Level6GorillaPhoto() {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const fileInputRef = useRef(null);
  const { isCoolingDown, remainingMs, triggerCooldown } = useLevelCooldown('level6');

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
    }
  };

  const handleSubmit = () => {
    if (isCoolingDown) return;

    if (photoUrl) {
      setShowSuccess(true);
      return;
    }

    triggerCooldown();
    setShowError(true);
  };

  const currentLevelColor = "#8B5CF6";

  return (
    <div className="w-full flex-1 flex flex-col justify-center animate-in slide-in-from-bottom duration-500">
      
      <div className="bg-[#1A1D2E]/80 backdrop-blur-md p-6 rounded-[2rem] border-2 shadow-2xl mb-8 flex flex-col items-center" style={{ borderColor: `${currentLevelColor}50` }}>
        
        <h2 className="text-[#FBBF24] font-bold text-xl text-center mb-2">大猩猩力量認證</h2>
        <p className="text-gray-300 text-sm text-center mb-6">
          請全隊一起擺出「大猩猩捶胸頓足」的超兇姿勢拍照上傳！
        </p>

        {/* Camera Area */}
        <div className="w-full aspect-square max-w-[280px] bg-gray-900 rounded-[2rem] border-4 border-dashed border-gray-600 mb-6 flex flex-col items-center justify-center relative overflow-hidden">
          {photoUrl ? (
            <>
              <img src={photoUrl} alt="Uploaded" className="w-full h-full object-cover" />
              {/* Overlay Watermark */}
              <div className="absolute top-2 right-2 flex items-center bg-black/60 rounded-lg p-2 backdrop-blur-sm border border-white/20">
                 <img src={characterAssets.level6.image} alt="Tung Tung Tung Sahur" className="w-6 h-6 mr-2 object-contain" />
                 <span className="text-[10px] text-white font-bold leading-none">Tung Tung<br/>Sahur</span>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 flex flex-col items-center">
              <Camera size={48} className="mb-2 opacity-50" />
              <span>點擊上傳照片</span>
            </div>
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handlePhotoUpload}
            ref={fileInputRef}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isCoolingDown}
          className={`w-full py-4 rounded-2xl font-bold shadow-lg text-white transition-all duration-300 active:scale-95 border-b-4 flex items-center justify-center gap-2
            ${photoUrl 
              ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6d28d9] border-[#4c1d95] shadow-[0_0_20px_rgba(139,92,246,0.5)]' 
              : 'bg-gray-700 border-gray-900'}
          `}
        >
          送出認證！ ✅
        </button>

      </div>

      <Modal 
        isOpen={showSuccess && !isCoolingDown} 
        onClose={() => navigate('/dashboard')}
        title="認證成功"
        type="success"
      >
        <div className="flex flex-col items-center">
           <img src={characterAssets.level6.image} alt="Tung Tung Tung Sahur" className="w-20 h-20 mb-4 animate-bounce object-contain" />
           <p className="text-white text-center font-bold mb-4">咚咚咚很滿意你們的力量！<br/>你獲得了食材收集提示！</p>
           <div className="bg-[#1A1D2E] p-4 rounded-xl border border-[#FBBF24] text-center w-full shadow-inner">
             <p className="text-[#FBBF24] text-xs mb-1">=== 闖關重點 ===</p>
             <p className="text-white text-sm font-bold">
               請繼續收集：麵粉、水、神聖番茄、帕瑪森起司、魔法羅勒葉 <br/>
               回到 <span className="text-[#4ADE80]">合成協作站</span> 一起完成加工
             </p>
           </div>
        </div>
      </Modal>

      <Modal
        isOpen={showError}
        onClose={() => { setShowError(false); navigate('/dashboard'); }}
        title="認證失敗，進入冷卻"
        type="error"
        showCloseButton={true}
      >
        <p className="text-white">尚未上傳有效照片，咚咚咚認為你們還沒準備好。</p>
        <p className="text-sm text-pink-200 mt-2">冷卻時間：{formatCooldownTime(remainingMs)}</p>
      </Modal>

      <Modal
        isOpen={isCoolingDown && !showError}
        onClose={() => navigate('/dashboard')}
        title="關卡冷卻中"
        type="warning"
        showCloseButton={true}
      >
        <p className="text-white">此關暫時鎖定，請先去其他關卡完成任務。</p>
        <p className="text-[#FBBF24] font-bold mt-2">剩餘時間：{formatCooldownTime(remainingMs)}</p>
      </Modal>

    </div>
  );
}
