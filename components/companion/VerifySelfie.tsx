'use client';

// VerifySelfie — optional live-camera selfie capture.
// Falls back gracefully when camera is unavailable or permission is denied.

import { useState, useRef, useCallback } from 'react';
import { Camera, X } from 'lucide-react';

interface Props {
  /** Called with the captured jpeg File; caller sets it as the photoFile. */
  onCapture: (file: File) => void;
}

export function VerifySelfie({ onCapture }: Props) {
  const [streaming, setStreaming] = useState(false);
  const [denied, setDenied]       = useState(false);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setDenied(true); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setStreaming(true);
    } catch {
      setDenied(true);
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }));
        stop();
      },
      'image/jpeg',
      0.85,
    );
  }, [onCapture, stop]);

  if (denied) {
    return (
      <p className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
        Camera unavailable — use the file upload above instead.
      </p>
    );
  }

  if (streaming) {
    return (
      <div className="space-y-2">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full rounded-xl"
          style={{ maxHeight: 200, objectFit: 'cover' }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={capture}
            className="flex-1 rounded-xl py-2 font-sans text-sm font-semibold"
            style={{ background: 'var(--color-azure)', color: '#fff' }}
          >
            Capture selfie
          </button>
          <button
            type="button"
            onClick={stop}
            aria-label="Cancel camera"
            className="rounded-xl px-3 py-2"
            style={{ border: '1.5px solid rgba(46,107,255,0.25)', color: 'var(--color-azure-deep)' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className="flex items-center gap-2 font-sans text-sm font-medium"
      style={{ color: 'var(--color-azure-deep)' }}
    >
      <Camera size={16} />
      Take a live selfie instead
    </button>
  );
}
