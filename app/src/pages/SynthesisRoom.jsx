import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DragDropContainer from '../components/DragDropContainer';
import Modal from '../components/Modal';
import { ingredientImages, uiImages } from '../assets';

export default function SynthesisRoom() {
  const navigate = useNavigate();
  const [showEnding, setShowEnding] = useState(false);

  // Five collected materials ready for synthesis
  const collectedItems = [
    { id: 'flour', imageSrc: ingredientImages.premiumFlour, label: 'Flour', color: '#FBBF24' },
    { id: 'water', imageSrc: ingredientImages.pureSpringWater, label: 'Water', color: '#38BDF8' },
    { id: 'tomato', imageSrc: ingredientImages.holyTomato, label: 'Tomato', color: '#EF4444' },
    { id: 'cheese', imageSrc: ingredientImages.richParmesanCheese, label: 'Cheese', color: '#FBBF24' },
    { id: 'basil', imageSrc: ingredientImages.magicBasilLeaf, label: 'Basil', color: '#4ADE80' }
  ];

  const handleSynthesis = (slots) => {
    // All 5 materials are required.
    const filledCount = slots.filter(s => s !== null).length;
    if (filledCount === 5) {
      setTimeout(() => setShowEnding(true), 1500);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#0D0F1A] pb-8 relative overflow-hidden">
      
      {/* Mystical Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#7C5CFC]/20 via-[#1A1D2E] to-[#0D0F1A] z-0 pointer-events-none border-t-4 border-[#7C5CFC]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] aspect-square bg-[#7C5CFC]/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}></div>

      <div className="relative z-10 w-full pt-12 pb-6 px-4 flex flex-col items-center">
         <h1 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#4ADE80] to-[#38BDF8] drop-shadow-md">
           合成協作站
         </h1>
         <p className="text-gray-400 text-sm text-center mb-8">集齊五種食材後，將它們放入合成器進行中繼加工！</p>
      </div>

      <div className="flex-1 w-full max-w-sm mx-auto px-4 flex flex-col relative z-10">
        
        {/* The Pizza Pan Area */}
        <div className="bg-[#1A1D2E]/50 backdrop-blur-md rounded-[3rem] border border-[#7C5CFC]/30 p-6 shadow-[0_0_50px_rgba(124,92,252,0.15)] flex flex-col items-center">
          
          <div className="w-48 h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full border-8 border-gray-700 shadow-inner flex flex-col items-center justify-center mb-8 relative">
             <img src={uiImages.synthesizer} alt="神聖烤盤" className="w-24 h-24 opacity-30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain" />
             <p className="text-gray-500 font-bold z-10 text-sm">神聖烤盤</p>
          </div>

          <div className="w-full">
            <DragDropContainer 
              items={collectedItems}
              slotsCount={5}
              onComplete={handleSynthesis}
            />
          </div>

        </div>

      </div>

      <Modal 
        isOpen={showEnding} 
        onClose={() => navigate('/victory')}
        title="✨ 合成完成！"
        type="info"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center p-4">
          <div className="w-32 h-32 mb-6 bg-gradient-to-br from-[#7C5CFC] to-[#F472B6] rounded-[3rem] flex items-center justify-center shadow-[0_0_50px_rgba(244,114,182,0.8)] animate-spin p-3" style={{ animationDuration: '3s' }}>
            <img src={uiImages.ultimatePizza} alt="終極瑪格麗特披薩" className="w-full h-full object-contain" />
          </div>
          <p className="text-xl text-white font-bold mb-2 tracking-widest text-[#FBBF24]">終極瑪格麗特披薩</p>
          <p className="text-sm text-gray-300 mb-8">五種食材已完成加工，下一步可以前往最終挑戰！</p>
          
          <button 
             onClick={() => navigate('/victory')}
             className="w-full px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#4ADE80] to-[#16a34a] border-b-4 border-[#14532d] active:border-b-0 active:translate-y-1 shadow-lg"
          >
             前往下一階段
          </button>
        </div>
      </Modal>

    </div>
  );
}
