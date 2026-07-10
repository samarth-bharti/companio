import { describe, it, expect, afterEach, vi } from 'vitest';
import { isPlaceholder, envValue } from '@/lib/env';

// A `.env` value is a string, and a string is truthy. So
// `GOOGLE_CLIENT_ID=[[from Google Cloud Console]]` made every "is this
// configured?" check answer yes: the app registered a Google provider with a
// fake client id, told the browser real sign-in was available, and died at the
// OAuth redirect with a message that explained nothing.
//
// An unset variable is honest. A placeholder is a lie the code believes.

describe('isPlaceholder', () => {
  it('treats absent and empty as placeholders', () => {
    expect(isPlaceholder(undefined)).toBe(true);
    expect(isPlaceholder(null)).toBe(true);
    expect(isPlaceholder('')).toBe(true);
    expect(isPlaceholder('   ')).toBe(true);
  });

  it('catches the bracket style this repo uses', () => {
    expect(isPlaceholder('[[from Google Cloud Console]]')).toBe(true);
    expect(isPlaceholder('[[Grievance Officer phone]]')).toBe(true);
  });

  it('catches the angle-bracket style', () => {
    expect(isPlaceholder('<your-client-id>')).toBe(true);
  });

  it('catches common filler words, case-insensitively', () => {
    for (const v of ['changeme', 'CHANGEME', 'todo', 'xxx', 'xxxxxx', 'your_key', 'your-secret']) {
      expect(isPlaceholder(v), v).toBe(true);
    }
  });

  it('accepts values that merely look unusual but are real', () => {
    for (const v of [
      'postgresql://u:p@ep-a-pooler.aws.neon.tech/neondb?sslmode=require',
      'VlFe58DWfQIfwjdOqCH8Kocx11oAMXDotY3F4f5Y+kA=',
      '1234-abc.apps.googleusercontent.com',
      'rzp_test_ABC123',
      'x', // short, but somebody meant it
    ]) {
      expect(isPlaceholder(v), v).toBe(false);
    }
  });

  it('does not mistake a real secret that merely contains "xxx"', () => {
    expect(isPlaceholder('sk_live_xxxAbC123')).toBe(false);
  });
});

describe('envValue', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns undefined for an unset var', () => {
    expect(envValue('COMPANIO_TEST_UNSET')).toBeUndefined();
  });

  it('returns undefined for a placeholder rather than the placeholder text', () => {
    vi.stubEnv('COMPANIO_TEST_VAR', '[[fill me in]]');
    expect(envValue('COMPANIO_TEST_VAR')).toBeUndefined();
  });

  it('returns a real value untouched', () => {
    vi.stubEnv('COMPANIO_TEST_VAR', 'real-value');
    expect(envValue('COMPANIO_TEST_VAR')).toBe('real-value');
  });
});
