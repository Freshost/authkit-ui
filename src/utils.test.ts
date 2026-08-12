import { describe, it, expect } from 'vitest';

import { AuthkitError } from './api/client';
import { codeFrom, loginErrorKey, messageFrom } from './utils';

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

describe('loginErrorKey', () => {
  it('uses the credential message only for an explicit invalid-credentials response', () => {
    expect(
      loginErrorKey(new AuthkitError(401, 'invalid_credentials', 'Invalid email or password')),
    ).toBe('login.invalidCredentials');
  });

  it('distinguishes a transport failure from invalid credentials', () => {
    expect(loginErrorKey(new AuthkitError(0, 'network_error', 'Network Error'))).toBe(
      'login.networkError',
    );
  });

  it('uses a server message for unexpected responses and unknown failures', () => {
    expect(loginErrorKey(new AuthkitError(503, 'service_unavailable', 'Unavailable'))).toBe(
      'login.serverError',
    );
    expect(loginErrorKey(new Error('Unexpected failure'))).toBe('login.serverError');
  });

  it('preserves the existing rate-limit and disabled-account messages', () => {
    expect(loginErrorKey(new AuthkitError(429, 'rate_limited', 'Slow down'))).toBe(
      'login.rateLimited',
    );
    expect(loginErrorKey(new AuthkitError(403, 'account_disabled', 'Disabled'))).toBe(
      'login.accountDisabled',
    );
  });
});
