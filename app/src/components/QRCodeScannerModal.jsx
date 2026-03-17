import React, { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Modal from './Modal';

async function waitForElementById(elementId, maxMs = 1500) {
  const start = Date.now();
  while (Date.now() - start <= maxMs) {
    const element = document.getElementById(elementId);
    if (element) return element;
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  throw new Error('掃描區塊尚未建立，請再試一次。');
}

async function ensureCameraPermission() {
  if (!window.isSecureContext) {
    throw new Error('相機功能需要安全連線，請改用 HTTPS 或 localhost 開啟頁面。');
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('目前瀏覽器不支援相機存取，請改用最新版 Chrome 或 Safari。');
  }

  try {
    if (navigator.permissions?.query) {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' });
      if (cameraPermission.state === 'denied') {
        throw new Error('相機權限已被封鎖，請到瀏覽器設定將相機權限改為允許。');
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
        await waitForElementById(scannerId);
        if (cancelled) return;

        await ensureCameraPermission();
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
        setErrorText(error?.message || '無法開啟相機，請確認相機權限。');
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
          activeScanner.clear().catch(() => {});
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
      title="掃描 QR Code"
      type="info"
      showCloseButton={true}
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-300">請將 QR Code 對準框內，系統會自動辨識。</p>
        <div className="rounded-2xl overflow-hidden border border-white/20 bg-black min-h-[260px]">
          <div id={scannerId} className="w-full min-h-[260px]" />
        </div>
        {errorText ? (
          <div className="text-xs text-pink-300 bg-pink-900/30 border border-pink-500/40 rounded-lg p-2">
            {errorText}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
