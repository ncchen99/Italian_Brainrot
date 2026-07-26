import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import Modal from '../components/Modal';
import { characterAssets, uiImages } from '../assets';
import useLevelCooldown, { formatCooldownTime } from '../hooks/useLevelCooldown';
import { useAppSession } from '../contexts/AppSessionContext';
import { ensureAnonymousAuth } from '../services/authService';
import { uploadImageToFirebaseStorage } from '../services/uploadService';
import { saveLevelProgress, saveUploadRecord, assignAntennaAndPasscode } from '../services/progressService';
import { validateGorillaPose } from '../services/aiService';
import { useTranslation, Trans } from 'react-i18next';

export default function Level6GorillaPhoto() {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [submitError, setSubmitError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [antennaState, setAntennaState] = useState(null);
  const [aiResultReason, setAiResultReason] = useState('');
  const fileInputRef = useRef(null);
  const { isCoolingDown, remainingMs, triggerCooldown } = useLevelCooldown('level6');
  const { teamId, activeChallenge } = useAppSession();
  const { t } = useTranslation();

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      setPhotoFile(file);
      setUploadStatus('idle');
      setSubmitError('');
    }
  };

  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  const handleSubmit = async () => {
    if (isCoolingDown) return;

    if (photoFile && photoUrl) {
      setUploadStatus('uploading');
      setSubmitError('');
      setAiResultReason('');

      try {
        const authUser = await ensureAnonymousAuth();
        const effectiveTeamId = teamId || authUser?.uid || null;
        if (!effectiveTeamId) {
          throw new Error(t('level6.errorNoAuth'));
        }

        // Call the AI validation service
        const aiResult = await validateGorillaPose(photoFile);
        setAiResultReason(aiResult.reason);

        if (!aiResult.passed) {
          if (effectiveTeamId && activeChallenge?.id) {
            await saveLevelProgress({
              teamId: effectiveTeamId,
              sessionId: activeChallenge.id,
              levelId: 'level6',
              status: 'failed'
            }).catch(console.error);
          }
          setUploadStatus('idle');
          triggerCooldown();
          setShowError(true);
          return;
        }

        const uploadResult = await uploadImageToFirebaseStorage({
          file: photoFile,
          teamId: effectiveTeamId,
          levelId: 'level6'
        });

        if (effectiveTeamId) {
          const { antennaColor, passCode } = await assignAntennaAndPasscode({ teamId: effectiveTeamId });
          setAntennaState({ antennaColor, passCode });

          await saveUploadRecord({
            teamId: effectiveTeamId,
            levelId: 'level6',
            imageUrl: uploadResult.publicUrl,
            objectKey: uploadResult.objectKey
          });
          await saveLevelProgress({
            teamId: effectiveTeamId,
            sessionId: activeChallenge?.id || null,
            levelId: 'level6',
            status: 'completed',
            payload: {
              proofImageUrl: uploadResult.publicUrl,
              antennaColor,
              passCode
            }
          });
        } else {
          setAntennaState({ antennaColor: 'blue', passCode: '000' });
        }

        setUploadStatus('success');
      } catch (error) {
        console.error('[level6] upload or progress save failed', {
          code: error?.code,
          message: error?.message,
          teamId: teamId || null
        });
        setUploadStatus('error');
        setSubmitError(error?.message || t('level6.errorUploadFailed'));
        return;
      }

      setShowSuccess(true);
      return;
    }

    setAiResultReason('');
    if (teamId && activeChallenge?.id) {
      saveLevelProgress({
        teamId,
        sessionId: activeChallenge.id,
        levelId: 'level6',
        status: 'failed'
      }).catch(() => { });
    }
    triggerCooldown();
    setShowError(true);
  };

  const currentLevelColor = "#8B5CF6";

  return (
    <div className="w-full flex-1 flex flex-col justify-center animate-in slide-in-from-bottom duration-500">

      <div className="bg-[#1A1D2E]/80 backdrop-blur-md p-6 rounded-[2rem] border-2 shadow-2xl mb-8 flex flex-col items-center" style={{ borderColor: `${currentLevelColor}50` }}>

        <h2 className="text-[#FBBF24] font-bold text-xl text-center mb-2">{t('level6.title')}</h2>
        <p className="text-gray-300 text-sm text-center mb-6">
          {t('level6.desc')}
        </p>

        {/* Camera Area */}
        <div className="w-full aspect-square max-w-[280px] bg-gray-900 rounded-[2rem] border-4 border-dashed border-gray-600 mb-6 flex flex-col items-center justify-center relative overflow-hidden">
          {photoUrl ? (
            <>
              <img src={photoUrl} alt="Uploaded" className="w-full h-full object-cover" />
              {/* Overlay Watermark */}
              <div className="absolute top-2 end-2 flex items-center bg-black/60 rounded-lg p-2 backdrop-blur-sm border border-white/20">
                <img src={characterAssets.level6.image} alt="Tung Tung Tung Sahur" className="w-6 h-6 me-2 object-contain" />
                <span className="text-[10px] text-white font-bold leading-none">Tung Tung<br />Sahur</span>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 flex flex-col items-center">
              <Camera size={48} className="mb-2 opacity-50" />
              <span>{t('level6.clickToUpload')}</span>
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
          disabled={isCoolingDown || uploadStatus === 'uploading'}
          className={`w-full py-4 rounded-2xl font-bold shadow-lg text-white transition-all duration-300 active:scale-95 border-b-4 flex items-center justify-center gap-2
            ${photoUrl
              ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6d28d9] border-[#4c1d95] shadow-[0_0_20px_rgba(139,92,246,0.5)]'
              : 'bg-gray-700 border-gray-900'}
          `}
        >
          {uploadStatus === 'uploading' ? t('level6.uploading') : t('level6.submitBtn')}
        </button>
        {submitError ? (
          <p className="mt-3 text-sm text-pink-200 bg-pink-900/40 border border-pink-500/40 rounded-xl px-3 py-2 w-full">
            {submitError}
          </p>
        ) : null}

      </div>

      <Modal
        isOpen={showSuccess && !isCoolingDown}
        onClose={() => navigate('/dashboard')}
        title={t('level6.successTitle')}
        type="success"
      >
        <div className="flex flex-col items-center">
          <img src={characterAssets.level6.image} alt="Tung Tung Tung Sahur" className="w-20 h-20 mb-4 animate-bounce object-contain" />
          <p className="text-white text-center font-bold mb-2"><Trans i18nKey="level6.successMsg" components={[<br key="br" />]} /></p>
          
          {aiResultReason && (
            <p className="text-xs text-purple-200 text-center italic mb-4 bg-purple-950/40 border border-purple-500/20 rounded-xl px-3 py-2 w-full">
              AI 評語：{aiResultReason}
            </p>
          )}

          <div className="bg-[#1A1D2E] p-4 rounded-xl border border-[#FBBF24] text-center w-full shadow-inner mb-4">
            <p className="text-[#FBBF24] text-xs mb-1">{t('level6.keyPoint')}</p>
            <p className="text-white text-sm font-bold">
              <Trans i18nKey="level6.keyDesc" components={{ br: <br />, span: <span className="text-[#4ADE80]" /> }} />
            </p>
          </div>

          <div className="bg-[#166534] text-green-100 p-3 rounded-xl border border-green-500 text-sm w-full">
            <span className="inline-flex items-center gap-2 font-bold mb-1">
              <img src={antennaState?.antennaColor === 'red' ? uiImages.wifiRed : uiImages.wifiBlue} alt={antennaState?.antennaColor === 'red' ? t('level6.antennaRedAlt') : t('level6.antennaBlueAlt')} className="w-5 h-5 object-contain" />
              {t('level6.antennaGot', { passCode: antennaState?.passCode, color: antennaState?.antennaColor === 'red' ? t('level6.colorRed') : t('level6.colorBlue') })}
            </span>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showError}
        onClose={() => { setShowError(false); navigate('/dashboard'); }}
        title={t('level6.failTitle')}
        type="error"
        showCloseButton={true}
      >
        <p className="text-white">{aiResultReason || t('level6.failMsg')}</p>
        <p className="text-sm text-pink-200 mt-2">{t('level6.cooldownTime')} {formatCooldownTime(remainingMs)}</p>
      </Modal>

      <Modal
        isOpen={isCoolingDown && !showError}
        onClose={() => navigate('/dashboard')}
        title={t('level6.cooldownTitle')}
        type="warning"
        showCloseButton={true}
      >
        <p className="text-white">{t('level6.cooldownMsg')}</p>
        <p className="text-[#FBBF24] font-bold mt-2">{t('level6.remTime')} {formatCooldownTime(remainingMs)}</p>
      </Modal>

    </div>
  );
}
