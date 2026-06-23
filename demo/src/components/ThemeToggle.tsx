import { useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { Dropdown, DropdownItem, DropdownList, MenuToggle, type MenuToggleElement } from '@freshost/ui';
import { DesktopIcon, MoonIcon, SunIcon } from '@freshost/ui/icons';

import { getStoredTheme, setStoredTheme, type ThemeMode } from '../theme';

/**
 * Light / dark / system theme picker. Used in the app masthead and, standalone,
 * floated over the login screen (which has no masthead) so the theme can be
 * switched before signing in.
 */
export function ThemeToggle() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ThemeMode>(getStoredTheme);
  const [isOpen, setIsOpen] = useState(false);

  const choose = (next: ThemeMode) => {
    setMode(next);
    setStoredTheme(next);
    setIsOpen(false);
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      popperProps={{ position: 'right' }}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          variant="plain"
          aria-label={t('nav.theme')}
          isExpanded={isOpen}
          onClick={() => setIsOpen((o) => !o)}
          icon={mode === 'dark' ? <MoonIcon aria-hidden /> : <SunIcon aria-hidden />}
        />
      )}
    >
      <DropdownList>
        <DropdownItem icon={<SunIcon />} onClick={() => choose('light')}>
          {t('nav.themeLight')}
        </DropdownItem>
        <DropdownItem icon={<MoonIcon />} onClick={() => choose('dark')}>
          {t('nav.themeDark')}
        </DropdownItem>
        <DropdownItem icon={<DesktopIcon />} onClick={() => choose('system')}>
          {t('nav.themeSystem')}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}
