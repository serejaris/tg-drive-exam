"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
    destructive_text_color?: string;
    accent_text_color?: string;
    section_bg_color?: string;
    section_header_text_color?: string;
    subtitle_text_color?: string;
    [key: string]: string | undefined;
  };
  colorScheme: "light" | "dark";
  viewportHeight: number;
  viewportStableHeight: number;
}

interface TelegramContextValue {
  webApp: TelegramWebApp | null;
  isReady: boolean;
}

const TelegramContext = createContext<TelegramContextValue>({
  webApp: null,
  isReady: false,
});

export function useTelegram(): TelegramContextValue {
  return useContext(TelegramContext);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } })
      .Telegram?.WebApp;

    if (tg) {
      // Apply theme
      const root = document.documentElement;
      const tp = tg.themeParams;
      if (tp.bg_color) root.style.setProperty("--tg-bg", tp.bg_color);
      if (tp.text_color) root.style.setProperty("--tg-text", tp.text_color);
      if (tp.hint_color) root.style.setProperty("--tg-hint", tp.hint_color);
      if (tp.link_color) root.style.setProperty("--tg-link", tp.link_color);
      if (tp.button_color) root.style.setProperty("--tg-button", tp.button_color);
      if (tp.button_text_color) root.style.setProperty("--tg-button-text", tp.button_text_color);
      if (tp.secondary_bg_color) root.style.setProperty("--tg-secondary-bg", tp.secondary_bg_color);
      if (tp.destructive_text_color) root.style.setProperty("--tg-destructive", tp.destructive_text_color);
      if (tp.accent_text_color) root.style.setProperty("--tg-accent", tp.accent_text_color);
      if (tp.section_bg_color) root.style.setProperty("--tg-section-bg", tp.section_bg_color);
      if (tp.section_header_text_color) root.style.setProperty("--tg-section-text", tp.section_header_text_color);
      if (tp.subtitle_text_color) root.style.setProperty("--tg-subtitle", tp.subtitle_text_color);

      if (tg.colorScheme === "dark") {
        root.classList.add("dark");
      }

      tg.ready();
      tg.expand();

      setWebApp(tg);
      setIsReady(true);
    } else {
      // Fallback for browser testing
      setIsReady(true);
    }
  }, []);

  return (
    <TelegramContext.Provider value={{ webApp, isReady }}>
      {children}
    </TelegramContext.Provider>
  );
}
