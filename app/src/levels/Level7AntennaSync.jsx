import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NumericKeypad from '../components/NumericKeypad';
import Modal from '../components/Modal';
import { uiImages } from '../assets';
import useLevelCooldown, { formatCooldownTime } from '../hooks/useLevelCooldown';
import { useAppSession } from '../contexts/AppSessionContext';
import { saveLevelProgress, getSessionProgress, getValidPartnerPasscodes } from '../services/progressService';
import { useTranslation, Trans } from 'react-i18next';

export default function Level7AntennaSync() {
  const navigate = useNavigate();
  const [syncCode, setSyncCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { isCoolingDown, remainingMs, triggerCooldown } = useLevelCooldown('level7');
  const { teamId, activeChallenge, loading: sessionLoading } = useAppSession();
  const { t } = useTranslation();
  
  const [level7State, setLevel7State] = useState({ loading: true, antennaColor: null, passCode: null, missingFragment: false });

  React.useEffect(() => {
    if (sessionLoading) return;
    if (!teamId || !activeChallenge?.id) {
      setLevel7State({ loading: false, missingFragment: true });
      return;
    }
    
    getSessionProgress({ teamId, sessionId: activeChallenge.id }).then(progressMap => {
      const l6 = progressMap['level6'];
      if (l6?.status === 'completed' && l6?.antennaColor) {
        setLevel7State({
          loading: false,
          antennaColor: l6.antennaColor,
          passCode: l6.passCode,
          missingFragment: false
        });
      } else {
        setLevel7State({ loading: false, missingFragment: true });
      }
    }).catch(() => {
      setLevel7State({ loading: false, missingFragment: true });
    });
  }, [teamId, activeChallenge?.id, sessionLoading]);

  const handleKeyPress = (key) => {
    if (syncCode.length < 6) {
      setSyncCode(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setSyncCode(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (isCoolingDown || submitting || level7State.loading || level7State.missingFragment) return;
    setSubmitting(true);

    const partnerColor = level7State.antennaColor === 'red' ? 'blue' : 'red';
    
    // Check if prefix is own password
    if (syncCode.startsWith(level7State.passCode)) {
      const partnerCode = syncCode.slice(3, 6);
      const validCodes = await getValidPartnerPasscodes({ teamId, partnerColor });
      
      if (validCodes.includes(partnerCode)) {
        if (teamId && activeChallenge?.id) {
          saveLevelProgress({
            teamId,
            sessionId: activeChallenge.id,
            levelId: 'level7',
            status: 'completed'
          }).catch(() => {});
        }
        setShowSuccess(true);
        setSubmitting(false);
        return;
      }
    }

    if (teamId && activeChallenge?.id) {
      saveLevelProgress({
        teamId,
        sessionId: activeChallenge.id,
        levelId: 'level7',
        status: 'failed'
      }).catch(() => {});
    }
    triggerCooldown();
    setShowError(true);
    setSyncCode('');
    setSubmitting(false);
  };

  const formatDisplay = () => {
    const padded = syncCode.padEnd(6, '_');
    return `${padded.slice(0,3)} - ${padded.slice(3,6)}`;
  };

  const currentLevelColor = "#EF4444";
  const myColorHex = level7State.antennaColor === 'red' ? '#EF4444' : '#3B82F6';
  const myColorName = level7State.antennaColor === 'red' ? t('level7.colorRed') : t('level7.colorBlue');
  const partnerColorName = level7State.antennaColor === 'red' ? t('level7.colorBlue') : t('level7.colorRed');
  const myCodePart = level7State.passCode || '---';

  if (level7State.loading) return <div className="text-white flex-1 flex items-center justify-center">{t('level7.loading')}</div>;

  return (
    <div className="w-full flex-1 flex flex-col justify-center animate-in slide-in-from-bottom duration-500">
      
      {level7State.missingFragment && (
        <Modal 
          isOpen={true} 
          onClose={() => navigate('/dashboard')}
          title={t('level7.noAntennaTitle')}
          type="warning"
          showCloseButton={true}
        >
          <p className="text-white">{t('level7.noAntennaMsg')}</p>
        </Modal>
      )}

      <div className="bg-[#1A1D2E]/80 backdrop-blur-md p-6 rounded-[2rem] border-2 shadow-2xl mb-8" style={{ borderColor: `${currentLevelColor}50`, opacity: level7State.missingFragment ? 0.3 : 1 }}>
        
        <h2 className="text-[#FBBF24] font-bold text-xl text-center mb-4">{t('level7.title')}</h2>
        
        <div className="flex flex-col items-center mb-6">
           <div className="text-sm text-gray-400 mb-1">{t('level7.yourAntenna')}</div>
           <div 
             className="w-16 h-16 rounded-full flex items-center justify-center text-2xl border-4 animate-pulse mb-2 shadow-[0_0_15px_currentColor]"
             style={{ borderColor: myColorHex, color: myColorHex }}
           >
             <img src={level7State.antennaColor === 'red' ? uiImages.wifiRed : uiImages.wifiBlue} alt="Antenna" className="w-9 h-9 object-contain" />
           </div>
           <div className="font-bold text-lg" style={{ color: myColorHex }}>
             {t('level7.signal', { color: myColorName })}
           </div>
        </div>

        <div className="bg-[#0D0F1A] border-s-4 p-4 rounded-e-xl mb-6 shadow-md text-sm text-gray-200" style={{ borderColor: myColorHex }}>
          <p className="mb-2"><Trans i18nKey="level7.rule1" components={{ bold: <span className="font-bold" /> }} values={{ color: partnerColorName }} /></p>
          <p className="mb-2">{t('level7.rule2')}<span className="force-ltr text-2xl font-mono block text-center my-2 font-bold tracking-widest">{myCodePart} _ _ _</span></p>
          <p>{t('level7.rule3')}</p>
        </div>
        
        {/* Passcode Display */}
        <div className="flex justify-center mb-6">
          <div className="force-ltr bg-gray-900 border-2 border-gray-600 rounded-xl px-4 py-3 text-3xl font-mono text-white tracking-widest shadow-inner text-center w-full max-w-[280px]">
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
        isOpen={showSuccess && !isCoolingDown} 
        onClose={() => navigate('/synthesis')}
        title={t('level7.successTitle')}
        type="success"
      >
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 mb-4 rounded-2xl bg-[#0B1224] border border-white/20 p-2 shadow-[0_0_20px_rgba(124,92,252,0.45)]">
            <img src={uiImages.wifiFragments} alt="Wi-Fi" className="w-full h-full object-cover rounded-xl" />
          </div>
          <p className="text-white font-bold mb-2">{t('level7.successMsg1')}</p>
          <div className="bg-[#166534] text-green-100 p-3 rounded-xl border border-green-500 text-sm w-full font-bold">
            <Trans i18nKey="level7.successMsg2" components={[<br key="br" />]} />
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showError} 
        onClose={() => { setShowError(false); navigate('/dashboard'); }}
        title={t('level7.failTitle')}
        type="error"
        showCloseButton={true}
      >
        <p className="text-white">{t('level7.failMsg')}</p>
        <p className="text-sm text-pink-200 mt-2">{t('level7.cooldownTime')} {formatCooldownTime(remainingMs)}</p>
      </Modal>

      <Modal
        isOpen={isCoolingDown && !showError}
        onClose={() => navigate('/dashboard')}
        title={t('level7.cooldownTitle')}
        type="warning"
        showCloseButton={true}
      >
        <p className="text-white">{t('level7.cooldownMsg')}</p>
        <p className="text-[#FBBF24] font-bold mt-2">{t('level7.remTime')} {formatCooldownTime(remainingMs)}</p>
      </Modal>

    </div>
  );
}
