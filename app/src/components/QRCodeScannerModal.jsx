import React, { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Modal from './Modal';
import { useTranslation } from 'react-i18next';

async function waitForElementById(elementId, t, maxMs = 1500) {
  const start = Date.now();
  while (Date.now() - start <= maxMs) {
    const element = document.getElementById(elementId);
    if (element) return element;
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  throw new Error(t('qrcode.errScannerNotReady'));
}

async function ensureCameraPermission(t) {
  if (!window.isSecureContext) {
    throw new Error(t('qrcode.errHttpsRequired'));
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(t('qrcode.errBrowserNotSupported'));
  }

  try {
    if (navigator.permissions?.query) {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' });
      if (cameraPermission.state === 'denied') {
        throw new Error(t('qrcode.errPermissionDenied'));
      }
    }
  } catch {
    // Some browsers do not support camera permission query.
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
  } catch {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
  } finally {
    stream?.getTracks().forEach((track) => track.stop());
  }
}

export default function QRCodeScannerModal({ isOpen, onClose, onScan }) {
  const scannerId = useId().replaceAll(':', '-');
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const [errorText, setErrorText] = useState('');
  const [manualCode, setManualCode] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) {
      handledRef.current = false;
      return undefined;
    }

    let cancelled = false;
    const onScanSuccess = (decodedText) => {
      if (handledRef.current) return;
      handledRef.current = true;
      onScan(decodedText);
    };

    const startScanner = async () => {
      try {
        await waitForElementById(scannerId, t);
        if (cancelled) return;

        await ensureCameraPermission(t);
        if (cancelled) return;

        const scanner = new Html5Qrcode(scannerId, { verbose: false });
        scannerRef.current = scanner;

        try {
          await scanner.start(
            { facingMode: { exact: 'environment' } },
            { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
            onScanSuccess
          );
        } catch {
          await scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
            onScanSuccess
          );
        }
      } catch (error) {
        if (cancelled) return;
        setErrorText(error?.message || t('qrcode.errCameraFailed'));
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      const activeScanner = scannerRef.current;
      scannerRef.current = null;
      if (!activeScanner) return;

      activeScanner
        .stop()
        .catch(() => {})
        .finally(() => {
          Promise.resolve(activeScanner.clear()).catch(() => {});
        });
    };
  }, [isOpen, onScan, scannerId]);

  const handleClose = () => {
    setErrorText('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('qrcode.title')}
      type="info"
      showCloseButton={true}
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-300">{t('qrcode.instruction')}</p>
        <div className="rounded-2xl overflow-hidden border border-white/20 bg-black min-h-[260px]">
          <div id={scannerId} className="w-full min-h-[260px]" />
        </div>
        {errorText ? (
          <div className="text-xs text-pink-300 bg-pink-900/30 border border-pink-500/40 rounded-lg p-2">
            {errorText}
          </div>
        ) : null}
        <div className="pt-2 border-t border-white/10 flex gap-2">
          <input
            type="text"
            placeholder="輸入短碼 (1~8) 或 QR 碼"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualCode.trim()) {
                onScan(manualCode.trim());
              }
            }}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7C5CFC]"
          />
          <button
            type="button"
            onClick={() => {
              if (manualCode.trim()) {
                onScan(manualCode.trim());
              }
            }}
            className="bg-gradient-to-r from-[#7C5CFC] to-[#5b41c2] text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
          >
            確定
          </button>
        </div>
      </div>
    </Modal>
  );
}
