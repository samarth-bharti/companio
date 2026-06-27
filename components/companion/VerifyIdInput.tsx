'use client';

// VerifyIdInput — ID-type toggle + number field with live format validation.
// Client-only; imports from '@/lib/idFormat' (never the server file).

import { CheckCircle2, XCircle } from 'lucide-react';
import { validateIdNumber, type IdDocType } from '@/lib/idFormat';
import { cn } from '@/lib/utils';

interface Props {
  idDocType: IdDocType | null;
  idDocNumber: string;
  ocrMatched: boolean | null;
  onTypeChange: (t: IdDocType) => void;
  onNumberChange: (n: string) => void;
}

const TYPES: { id: IdDocType; label: string; placeholder: string }[] = [
  { id: 'aadhaar', label: 'Aadhaar', placeholder: '1234 5678 9012' },
  { id: 'pan',     label: 'PAN',     placeholder: 'ABCDE1234F' },
];

export function VerifyIdInput({
  idDocType,
  idDocNumber,
  ocrMatched,
  onTypeChange,
  onNumberChange,
}: Props) {
  const hasValue = idDocNumber.length > 0;
  const isValid  = idDocType ? validateIdNumber(idDocType, idDocNumber) : false;
  const showErr  = hasValue && !isValid;
  const showOk   = hasValue && isValid;
  const hint     = TYPES.find((t) => t.id === idDocType)?.placeholder ?? 'Select ID type first';

  return (
    <div className="space-y-3">
      {/* Type toggle */}
      <div className="flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTypeChange(t.id)}
            aria-pressed={idDocType === t.id}
            className={cn('flex-1 rounded-xl py-2 font-sans text-sm font-semibold transition-colors')}
            style={
              idDocType === t.id
                ? { background: 'var(--color-azure)', color: '#fff', border: 'none' }
                : {
                    border: '1.5px solid rgba(46,107,255,0.25)',
                    color: 'var(--color-azure-deep)',
                    background: 'rgba(46,107,255,0.03)',
                  }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Number field — only shown once a type is picked */}
      {idDocType && (
        <div className="relative">
          <input
            type="text"
            value={idDocNumber}
            onChange={(e) => onNumberChange(e.target.value)}
            placeholder={hint}
            aria-label={`${idDocType === 'aadhaar' ? 'Aadhaar' : 'PAN'} number`}
            aria-invalid={showErr}
            className="w-full rounded-xl px-4 py-3 font-sans text-sm pr-10"
            style={{
              border: `1.5px solid ${showErr ? '#C7161A' : showOk ? '#1FAE6B' : 'rgba(46,107,255,0.25)'}`,
              background: 'rgba(255,255,255,0.8)',
              color: 'var(--color-ink)',
              outline: 'none',
            }}
          />
          {showErr && (
            <XCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#C7161A' }} />
          )}
          {showOk && (
            <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#1FAE6B' }} />
          )}
        </div>
      )}

      {/* Inline format error */}
      {showErr && (
        <p className="font-sans text-xs" style={{ color: '#C7161A' }}>
          {idDocType === 'aadhaar'
            ? 'Enter a valid 12-digit Aadhaar number (starts with 2–9)'
            : 'Enter a valid PAN — format: ABCDE1234F'}
        </p>
      )}

      {/* OCR hint — only visible once number is valid */}
      {showOk && ocrMatched !== null && (
        <p className="font-sans text-xs" style={{ color: ocrMatched ? '#157A4A' : 'var(--color-ink-muted)' }}>
          {ocrMatched
            ? 'Document text matched ✓'
            : 'Couldn’t read document text — manual review will be done'}
        </p>
      )}
    </div>
  );
}
