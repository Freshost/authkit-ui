// Vitest setup: jest-dom matchers (augments vitest's `expect`) + DOM teardown
// after every test so RTL-rendered trees don't leak between cases.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
