import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DialogPanel from '../components/DialogPanel';
import { characterAssets, getIntroVoice } from '../assets';
import { useTranslation } from 'react-i18next';

export default function CharacterIntroPage() {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const [dialogFinished, setDialogFinished] = useState(false);
  const { t, i18n } = useTranslation();

  // Mock character database
  const characterData = {
    'level1': {
      name: 'Cappuccino Assassino',
      textKey: 'intro.level1_text',
      color: '#0D0F1A'
    },
    'level2': {
      name: 'Ballerina Cappuccina',
      textKey: 'intro.level2_text',
      color: '#F472B6'
    },
    'level3': {
      name: 'Brr Brr Patapim',
      textKey: 'intro.level3_text',
      color: '#4ADE80'
    },
    'level4': {
      name: 'Bombardilo Crocodilo',
      textKey: 'intro.level4_text',
      color: '#38BDF8'
    },
    'level5': {
      name: 'Lirili Larila',
      textKey: 'intro.level5_text',
      color: '#FBBF24'
    },
    'level6': {
      name: 'Tung Tung Tung Sahur',
      textKey: 'intro.level6_text',
      color: '#8B5CF6'
    },
    'level7': {
      name: 'Tralalero Tralala',
      textKey: 'intro.level7_text',
      color: '#EF4444'
    }
  };

  const currentCharacter = characterData[characterId] || characterData['level1'];
  const currentCharacterAsset = characterAssets[characterId] || characterAssets.level1;
  // The spoken line has to match the language the dialogue is printed in.
  const currentIntroAudio = getIntroVoice(characterId in characterData ? characterId : 'level1', i18n.language);

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

        <div className="px-2 w-full">
          <DialogPanel
            characterName={currentCharacter.name}
            dialogText={t(currentCharacter.textKey)}
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
              {t('intro.acceptBtn')}
            </span>
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full mt-4 py-3 text-gray-300 font-bold hover:text-[#FBBF24] transition-colors"
          >
            {t('intro.leaveBtn')}
          </button>
        </div>

      </div>
    </div>
  );
}
