import { describe, it, expect } from 'vitest';
import {
  validateAadhaar,
  validatePan,
  maskIdNumber,
  detectFileType,
  validateFileIntegrity,
  hashBuffer,
  normalizeAadhaar,
} from '@/lib/server/documentValidation';

describe('validateAadhaar (Verhoeff)', () => {
  it('accepts a checksum-valid 12-digit number', () => {
    expect(validateAadhaar('234123412346')).toBe(true);
    expect(validateAadhaar('987654321096')).toBe(true);
  });

  it('accepts spaced / dashed input', () => {
    expect(validateAadhaar('2341 2341 2346')).toBe(true);
    expect(validateAadhaar('2341-2341-2346')).toBe(true);
  });

  it('rejects a wrong check digit', () => {
    expect(validateAadhaar('234123412345')).toBe(false);
    expect(validateAadhaar('234123412347')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(validateAadhaar('23412341234')).toBe(false);
    expect(validateAadhaar('2341234123466')).toBe(false);
  });

  it('rejects numbers starting with 0 or 1 (never issued)', () => {
    expect(validateAadhaar('012345678901')).toBe(false);
    expect(validateAadhaar('112345678901')).toBe(false);
  });

  it('rejects non-numeric junk', () => {
    expect(validateAadhaar('abcd12341234')).toBe(false);
    expect(validateAadhaar('')).toBe(false);
  });
});

describe('validatePan', () => {
  it('accepts a well-formed individual PAN', () => {
    expect(validatePan('ABCPE1234F')).toBe(true);
    expect(validatePan('abcpe1234f')).toBe(true); // case-insensitive
  });

  it('rejects an unrecognised holder-type char', () => {
    expect(validatePan('ABCZE1234F')).toBe(false); // Z not a holder type
  });

  it('rejects malformed PANs', () => {
    expect(validatePan('ABCP12345F')).toBe(false); // digit where letter expected
    expect(validatePan('ABCPE1234')).toBe(false); // too short
    expect(validatePan('12CPE1234F')).toBe(false); // digits up front
  });
});

describe('maskIdNumber', () => {
  it('masks an Aadhaar to last 4', () => {
    expect(maskIdNumber('aadhaar', '234123412346')).toBe('XXXX XXXX 2346');
  });
  it('masks a PAN middle', () => {
    expect(maskIdNumber('pan', 'ABCPE1234F')).toBe('AB******F');
  });
});

// Minimal magic-byte fixtures.
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const JUNK = new Uint8Array([0x00, 0x01, 0x02, 0x03]);

describe('detectFileType', () => {
  it('detects jpeg / png / pdf by magic bytes', () => {
    expect(detectFileType(JPEG)).toBe('jpeg');
    expect(detectFileType(PNG)).toBe('png');
    expect(detectFileType(PDF)).toBe('pdf');
  });
  it('returns null for unknown bytes', () => {
    expect(detectFileType(JUNK)).toBe(null);
  });
});

describe('validateFileIntegrity', () => {
  it('rejects too-small files even if magic bytes match', () => {
    const r = validateFileIntegrity(JPEG); // 8 bytes < 1KB
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/too small/);
  });

  it('accepts a real-looking image of sane size', () => {
    const big = new Uint8Array(2048);
    big.set([0xff, 0xd8, 0xff]); // jpeg header
    const r = validateFileIntegrity(big);
    expect(r.valid).toBe(true);
    expect(r.type).toBe('jpeg');
  });

  it('rejects junk content', () => {
    const big = new Uint8Array(2048); // all zeros, no magic
    const r = validateFileIntegrity(big);
    expect(r.valid).toBe(false);
  });
});

describe('hashBuffer', () => {
  it('is stable and differs by content (duplicate detection)', () => {
    const a = new Uint8Array([1, 2, 3, 4]);
    const b = new Uint8Array([1, 2, 3, 4]);
    const c = new Uint8Array([9, 9, 9, 9]);
    expect(hashBuffer(a)).toBe(hashBuffer(b));
    expect(hashBuffer(a)).not.toBe(hashBuffer(c));
    expect(hashBuffer(a)).toHaveLength(64);
  });
});

describe('normalizeAadhaar', () => {
  it('strips spaces and dashes', () => {
    expect(normalizeAadhaar('2341 2341-2346')).toBe('234123412346');
  });
});
