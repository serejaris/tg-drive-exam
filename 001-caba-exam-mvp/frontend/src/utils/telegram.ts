declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        themeParams: Record<string, string>;
        colorScheme: 'light' | 'dark';
        initData: string;
        initDataUnsafe: Record<string, any>;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive: boolean) => void;
          hideProgress: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
        isExpanded: boolean;
        viewportHeight: string;
        viewportStableHeight: string;
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
      };
    };
  }
}

export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

export function getThemeParams(): Record<string, string> {
  if (isTelegramWebApp()) {
    return window.Telegram!.WebApp.themeParams || {};
  }
  // Default fallback theme (light)
  return {
    bg_color: '#ffffff',
    text_color: '#000000',
    button_color: '#3390ec',
    button_text_color: '#ffffff',
    secondary_bg_color: '#f0f0f0',
    hint_color: '#999999',
  };
}

export function applyTheme(): void {
  const params = getThemeParams();
  const root = document.documentElement;

  if (params.bg_color) root.style.setProperty('--tg-theme-bg-color', params.bg_color);
  if (params.text_color) root.style.setProperty('--tg-theme-text-color', params.text_color);
  if (params.button_color) root.style.setProperty('--tg-theme-button-color', params.button_color);
  if (params.button_text_color) root.style.setProperty('--tg-theme-button-text-color', params.button_text_color);
  if (params.secondary_bg_color) root.style.setProperty('--tg-theme-secondary-bg-color', params.secondary_bg_color);
  if (params.hint_color) root.style.setProperty('--tg-theme-hint-color', params.hint_color);
}

export function initTelegram(): void {
  if (isTelegramWebApp()) {
    const tg = window.Telegram!.WebApp;
    tg.ready();
    tg.expand();
    applyTheme();
  }
}

export function hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (isTelegramWebApp()) {
    window.Telegram!.WebApp.HapticFeedback.impactOccurred(style);
  }
}

export function getInitData(): string | null {
  if (isTelegramWebApp()) {
    return window.Telegram!.WebApp.initData || null;
  }
  return null;
}
