import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DialogPanel from '../components/DialogPanel';
import { characterAssets } from '../assets';

export default function CharacterIntroPage() {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const [dialogFinished, setDialogFinished] = useState(false);

  // Mock character database
  const characterData = {
    'level1': {
      name: 'Cappuccino Assassino',
      text: 'Cappu-cappu！吾乃暗影中的卡布奇諾！漢堡魔王用幻術讓我忘記了忍術的結印順序！沒有忍術，我是無法給你披薩材料的，那太不 Sigma 了！',
      color: '#0D0F1A'
    },
    'level2': {
      name: 'Ballerina Cappuccina',
      text: 'Mi mi mi mi！氣死我了，大破防！有人把我最愛的芭蕾舞鞋藏起來了！沒有舞鞋，我要怎麼跳給 Lololo 看？快幫我找回來！',
      color: '#F472B6'
    },
    'level3': {
      name: 'Brr Brr Patapim',
      text: '救命啊...我頭上的金色帽子裡有一隻叫做 Slim 的藍色青蛙一直在叫！提拉米蘇大師說需要一顆『超級充氣球』才能把它氣球般吹走。你們可以幫我嗎？',
      color: '#4ADE80'
    },
    'level4': {
      name: 'Bombardilo Crocodilo',
      text: '嘿嘿嘿！我是轟炸鱷鱷！今天不丟炸彈，我丟水球！既然你們覺得自己很聰明，來解開我的無敵邏輯題吧！答錯就把你們淋成落湯雞，超派！',
      color: '#38BDF8'
    },
    'level5': {
      name: 'Lirili Larila',
      text: '渴死我了，比沒有水更慘的是沒有 Wi-Fi。漢堡魔王在我的時間鬧鐘上鎖了『規律密碼』。你們能幫我破解數列重啟鬧鐘嗎？',
      color: '#FBBF24'
    },
    'level6': {
      name: 'Tung Tung Tung Sahur',
      text: '我也想變成木頭猩猩，一起對抗漢堡魔王，但是只有我自己力量不夠，你們可以跟我一起嗎？',
      color: '#8B5CF6'
    },
    'level7': {
      name: 'Tralalero Tralala',
      text: '魔王踩髒了我的全新限量版潮鞋！我要揍扁他！但他設下了雙色能量防護罩，單打獨鬥贏不了的，快去尋找不同顏色的盟友來幫忙！',
      color: '#EF4444'
    }
  };

  const currentCharacter = characterData[characterId] || characterData['level1'];
  const currentCharacterAsset = characterAssets[characterId] || characterAssets.level1;
  const introAudioByLevel = {
    level1: new URL('../../../assets/intro_audio/Cappuccino Assassino.mp3', import.meta.url).href,
    level2: new URL('../../../assets/intro_audio/Ballerina Cappuccina.mp3', import.meta.url).href,
    level3: new URL('../../../assets/intro_audio/Brr Brr Patapim.mp3', import.meta.url).href,
    level4: new URL('../../../assets/intro_audio/Bombardilo Crocodilo.mp3', import.meta.url).href,
    level5: new URL('../../../assets/intro_audio/Lirili Larila.mp3', import.meta.url).href,
    level6: new URL('../../../assets/intro_audio/Tung Tung Tung Sahur.mp3', import.meta.url).href,
    level7: new URL('../../../assets/intro_audio/Tralalero Tralala.mp3', import.meta.url).href
  };
  const currentIntroAudio = introAudioByLevel[characterId] || introAudioByLevel.level1;

  const handleStartChallenge = () => {
    navigate(`/level/${characterId}`);
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center overflow-hidden bg-gradient-to-b from-[#0D0F1A] via-[#141B34] to-[#1B1140]">

      {/* Background Decor */}
      <div
        className="absolute top-0 left-0 w-full h-1/2 opacity-20 blur-3xl rounded-b-full transition-colors duration-1000"
        style={{ backgroundColor: currentCharacter.color }}
      ></div>

      <div className="relative z-10 w-full flex-1 flex flex-col justify-end pb-8">

        {/* Character Image Placeholder */}
        <div className="flex-1 flex items-center justify-center p-8 animate-float">
          <div
            className="w-full max-w-[280px] aspect-square rounded-[3rem] shadow-2xl flex items-center justify-center text-8xl transform -rotate-3 border-2 border-white/10"
            style={{
              backgroundColor: currentCharacter.color,
              boxShadow: `0 20px 40px -10px ${currentCharacter.color}80`
            }}
          >
            <img src={currentCharacterAsset.image} alt={currentCharacter.name} className="w-full h-full object-contain p-5 drop-shadow-2xl" />
          </div>
        </div>

        {/* Dialog Panel Component */}
        <div className="px-2 w-full">
          <DialogPanel
            characterName={currentCharacter.name}
            dialogText={currentCharacter.text}
            avatarSrc={currentCharacterAsset.image}
            audioSrc={currentCharacterAsset.voice}
            followupAudioSrc={currentIntroAudio}
            showAvatar={false}
            onComplete={() => setDialogFinished(true)}
            typingSpeed={40}
          />
        </div>

        {/* Challenge Action Button */}
        <div className={`w-full px-6 mt-6 transition-all duration-500 ${dialogFinished ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
          <button
            onClick={handleStartChallenge}
            className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-[#FBBF24] to-[#E9A408] border-b-4 border-[#9A6404] active:border-b-0 active:translate-y-1 transition-all duration-150 py-4 shadow-[0_0_20px_rgba(251,191,36,0.4)]"
          >
            <div className="absolute inset-0 w-full h-full bg-white/30 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
            <span className="relative text-[#451a03] font-bold text-xl flex items-center justify-center gap-2 drop-shadow-sm">
              接受挑戰！
            </span>
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full mt-4 py-3 text-gray-300 font-bold hover:text-[#FBBF24] transition-colors"
          >
            先去其他地方轉轉
          </button>
        </div>

      </div>
    </div>
  );
}
