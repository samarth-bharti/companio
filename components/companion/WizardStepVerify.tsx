'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { validateFileIntegrity, validateIdNumber, type IdDocType } from '@/lib/idFormat';
import { VerifyIdInput } from './VerifyIdInput';
import { VerifySelfie } from './VerifySelfie';

/**
 * True when this build actually ships the documents to the server. Mirrors the
 * gate in ApplyWizard.handleSubmit — the two must never disagree, because one
 * decides what happens and the other decides what the applicant is told.
 */
const UPLOADS_ENABLED = process.env.NEXT_PUBLIC_DATA_CLIENT === 'http';

export interface VerifyData {
  photoFile:        File | null;
  photoUrl?:        string;
  idFile:           File | null;
  idPhotoUrl?:      string;
  backgroundConsent: boolean;
  platonicAck:      boolean;
  idDocType:        IdDocType | null;
  idDocNumber:      string;
  ocrMatched:       boolean | null;
}

interface Props {
  data: VerifyData;
  onChange: (patch: Partial<VerifyData>) => void;
}

type ScanStatus = 'idle' | 'scanning' | 'ok' | 'error';

export function WizardStepVerify({ data, onChange }: Props) {
  const [photoStatus, setPhotoStatus] = useState<ScanStatus>(data.photoFile ? 'ok' : 'idle');
  const [idStatus,    setIdStatus]    = useState<ScanStatus>(data.idFile    ? 'ok' : 'idle');
  const [photoErr,    setPhotoErr]    = useState<string | null>(null);
  const [idErr,       setIdErr]       = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const idRef    = useRef<HTMLInputElement>(null);

  // Keep a stable ref to onChange so the OCR effect doesn't re-fire on every render.
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  // OCR cross-check: lazily import tesseract.js after id file + valid number are set.
  // Progressive enhancement — any failure (module missing, timeout, bad image) is swallowed.
  useEffect(() => {
    if (!data.idFile || !data.idDocType) return;
    if (!validateIdNumber(data.idDocType, data.idDocNumber)) return;

    let cancelled = false;
    const file = data.idFile;
    const digits = data.idDocNumber.replace(/[\s-]/g, '');

    (async () => {
      try {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        const url = URL.createObjectURL(file);
        const { data: { text } } = await worker.recognize(url);
        await worker.terminate();
        URL.revokeObjectURL(url);
        if (cancelled) return;
        const matched = text.replace(/\s/g, '').includes(digits);
        onChangeRef.current({ ocrMatched: matched });
      } catch {
        // tesseract missing, WASM unsupported, or image unreadable — skip silently.
        if (!cancelled) onChangeRef.current({ ocrMatched: null });
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.idFile, data.idDocNumber, data.idDocType]);

  const handleFile = async (type: 'photo' | 'id', file: File | undefined) => {
    if (!file) return;
    const setter   = type === 'photo' ? setPhotoStatus : setIdStatus;
    const errSetter = type === 'photo' ? setPhotoErr   : setIdErr;
    setter('scanning');
    errSetter(null);
    const bytes  = new Uint8Array(await file.arrayBuffer());
    const result = validateFileIntegrity(bytes);
    if (!result.valid) {
      setter('error');
      errSetter(result.reason ?? 'Invalid file');
      return;
    }
    setter('ok');
    if (type === 'photo') {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onChange({ photoFile: file, photoUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onChange({ idFile: file, idPhotoUrl: dataUrl, ocrMatched: null });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h2 className="font-display text-h2 mb-1" style={{ color: 'var(--color-ink)' }}>
        Quick verification
      </h2>
      <p className="font-sans text-sm mb-2" style={{ color: 'var(--color-ink-muted)' }}>
        Verification builds trust with members and keeps the platform safe for everyone.
      </p>
      {/*
        This badge used to read "Demo mode — nothing is uploaded or stored"
        unconditionally. That is true in local mode and FALSE in http mode, which
        is what production runs: ApplyWizard posts both files to
        /api/application/upload, and the server persists a one-way hash of each,
        the masked ID number, and the OCR hint.

        Telling someone their government ID is not stored, on the screen where
        they hand it over, while storing a fingerprint of it, is the one place in
        this product where a stale string is not a cosmetic bug. Say what actually
        happens, in each mode.
      */}
      {UPLOADS_ENABLED ? (
        <p
          className="inline-block font-sans text-xs px-3 py-1 rounded-pill mb-6"
          style={{ background: 'rgba(46,107,255,0.08)', color: 'var(--color-azure-deep)' }}
        >
          We never store your ID image — only a one-way fingerprint and the last digits
        </p>
      ) : (
        <p
          className="inline-block font-sans text-xs px-3 py-1 rounded-pill mb-6"
          style={{ background: 'rgba(46,107,255,0.08)', color: 'var(--color-azure-deep)' }}
        >
          Demo mode — nothing is uploaded or stored
        </p>
      )}

      {/* Upload tiles */}
      <div className="grid sm:grid-cols-2 gap-4 mb-3">
        <div>
          <UploadTile
            id="wiz-photo"
            inputRef={photoRef}
            label="Profile photo"
            hint="A clear, friendly photo"
            accept="image/*"
            file={data.photoFile}
            status={photoStatus}
            onChange={(f) => handleFile('photo', f)}
          />
          {photoErr && <p className="mt-1 font-sans text-xs" style={{ color: '#C7161A' }}>{photoErr}</p>}
          <div className="mt-2">
            <VerifySelfie onCapture={(f) => handleFile('photo', f)} />
          </div>
        </div>
        <div>
          <UploadTile
            id="wiz-id"
            inputRef={idRef}
            label="Government ID"
            hint="Aadhaar, PAN, or passport scan"
            accept="image/*,.pdf"
            file={data.idFile}
            status={idStatus}
            onChange={(f) => handleFile('id', f)}
          />
          {idErr && <p className="mt-1 font-sans text-xs" style={{ color: '#C7161A' }}>{idErr}</p>}
        </div>
      </div>

      {/* ID type + number */}
      <div className="mb-6">
        <p className="font-sans text-sm font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
          ID details
        </p>
        <VerifyIdInput
          idDocType={data.idDocType}
          idDocNumber={data.idDocNumber}
          ocrMatched={data.ocrMatched}
          onTypeChange={(t) => onChange({ idDocType: t, idDocNumber: '', ocrMatched: null })}
          onNumberChange={(n) => onChange({ idDocNumber: n, ocrMatched: null })}
        />
      </div>

      {/* Consent checkboxes */}
      <div className="space-y-4">
        <CheckRow id="wiz-bg-consent" checked={data.backgroundConsent} onChange={(v) => onChange({ backgroundConsent: v })} required>
          I consent to Companio running a background check on me, now or later.{' '}
          <Link href="/safety" className="underline underline-offset-4" style={{ color: 'var(--color-azure-deep)' }}>
            Learn about safety
          </Link>
        </CheckRow>
        <CheckRow id="wiz-platonic" checked={data.platonicAck} onChange={(v) => onChange({ platonicAck: v })} required>
          I understand and agree that all meetups on Companio are strictly platonic. Zero
          tolerance for anything else — this is non-negotiable and grounds for immediate removal.
        </CheckRow>
      </div>
    </div>
  );
}

/* ─── UploadTile ─────────────────────────────────────────────────────────── */

interface UploadTileProps {
  id: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  status: ScanStatus;
  onChange: (f: File | undefined) => void;
}

function UploadTile({ id, inputRef, label, hint, accept, file, status, onChange }: UploadTileProps) {
  const isOk       = status === 'ok';
  const isScanning = status === 'scanning';
  const isError    = status === 'error';

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0])}
        aria-label={label}
      />
      <label
        htmlFor={id}
        className={cn('flex flex-col items-center justify-center gap-2 rounded-xl p-6 cursor-pointer transition-colors min-h-[120px]')}
        style={{
          border: `2px dashed ${isError ? '#C7161A' : isOk ? '#1FAE6B' : 'rgba(46,107,255,0.25)'}`,
          background: isError ? 'rgba(199,22,26,0.04)' : isOk ? 'rgba(31,174,107,0.06)' : 'rgba(46,107,255,0.03)',
        }}
      >
        {isScanning ? (
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--color-azure)' }} />
        ) : isOk ? (
          <CheckCircle2 size={22} style={{ color: '#1FAE6B' }} />
        ) : (
          <Upload size={22} style={{ color: isError ? '#C7161A' : 'var(--color-azure)' }} />
        )}
        <span className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
          {label}
        </span>
        {file && isOk ? (
          <span className="font-sans text-xs text-center" style={{ color: '#157A4A' }}>
            Looks good — {file.name}
          </span>
        ) : (
          <span className="font-sans text-xs" style={{ color: isError ? '#C7161A' : 'var(--color-ink-muted)' }}>
            {isScanning ? 'Checking…' : isError ? 'Choose a different file' : hint}
          </span>
        )}
      </label>
    </div>
  );
}

/* ─── CheckRow ───────────────────────────────────────────────────────────── */

interface CheckRowProps {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  children: React.ReactNode;
}

function CheckRow({ id, checked, onChange, required, children }: CheckRowProps) {
  return (
    <label htmlFor={id} className="flex gap-3 cursor-pointer" style={{ color: 'var(--color-ink)' }}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        className="mt-0.5 w-4 h-4 rounded shrink-0 cursor-pointer"
        style={{ accentColor: 'var(--color-azure)' }}
      />
      <span className="font-sans text-sm leading-relaxed">{children}</span>
    </label>
  );
}
