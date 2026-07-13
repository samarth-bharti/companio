import { describe, it, expect } from 'vitest';
import { credentialString } from '@/lib/auth';

/**
 * A credentials provider hands next-auth a form-encoded body, so every field
 * arrives as a string. `signIn('email-otp', { firstName: undefined })` therefore
 * transmits the four-letter word "undefined" — truthy, and it walked straight
 * past `opts.firstName?.trim() || 'Friend'`.
 *
 * The result was an account whose first name was the string "undefined", and a
 * dashboard that opened with "Good afternoon, undefined".
 */
describe('credentialString', () => {
  it('rejects the string "undefined" — the bug that named a member', () => {
    expect(credentialString('undefined')).toBeUndefined();
  });

  it('rejects the string "null" for the same reason', () => {
    expect(credentialString('null')).toBeUndefined();
  });

  it('rejects a real undefined, a real null, and an empty string', () => {
    expect(credentialString(undefined)).toBeUndefined();
    expect(credentialString(null)).toBeUndefined();
    expect(credentialString('')).toBeUndefined();
    expect(credentialString('   ')).toBeUndefined();
  });

  it('trims and keeps a genuine name', () => {
    expect(credentialString('  Meghna  ')).toBe('Meghna');
  });

  // Only the exact words are refused: somebody really can be called Null.
  it('keeps a name that merely contains the word', () => {
    expect(credentialString('Undefined Kumar')).toBe('Undefined Kumar');
  });
});
