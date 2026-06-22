// Minimal PatternFly v6 dark-mode handling: toggle the `pf-v6-theme-dark` class
// on <html> (the documented v6 mechanism). No next-themes dependency.

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'authkit-demo-theme';

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(mode: ThemeMode): void {
  const dark = mode === 'dark' || (mode === 'system' && prefersDark());
  document.documentElement.classList.toggle('pf-v6-theme-dark', dark);
}

export function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

export function setStoredTheme(mode: ThemeMode): void {
  localStorage.setItem(STORAGE_KEY, mode);
  applyTheme(mode);
}
