import { describe, it, expect } from 'vitest';

import { AuthkitError } from './api/client';
import { codeFrom, messageFrom } from './utils';

describe('messageFrom', () => {
  it('returns the AuthkitError message', () => {
    const err = new AuthkitError(403, 'account_disabled', 'Account is disabled');
    expect(messageFrom(err, 'fallback')).toBe('Account is disabled');
  });

  it('returns a plain Error message when it has one', () => {
    expect(messageFrom(new Error('boom'), 'fallback')).toBe('boom');
  });

  it('falls back for a plain Error with an empty message', () => {
    expect(messageFrom(new Error(''), 'fallback')).toBe('fallback');
  });

  it('falls back for an unknown thrown value', () => {
    expect(messageFrom('a string', 'fallback')).toBe('fallback');
    expect(messageFrom(undefined, 'fallback')).toBe('fallback');
    expect(messageFrom({ nope: true }, 'fallback')).toBe('fallback');
  });
});

describe('codeFrom', () => {
  it('returns the backend code for an AuthkitError', () => {
    const err = new AuthkitError(429, 'rate_limited', 'Too many attempts');
    expect(codeFrom(err)).toBe('rate_limited');
  });

  it('returns an empty string for a plain Error', () => {
    expect(codeFrom(new Error('boom'))).toBe('');
  });

  it('returns an empty string for an unknown thrown value', () => {
    expect(codeFrom('a string')).toBe('');
    expect(codeFrom(undefined)).toBe('');
  });
});
