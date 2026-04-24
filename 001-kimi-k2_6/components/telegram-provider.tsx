"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemeParams = {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
};

type WebApp = {
  ready: () => void;
  expand: () => void;
  initData: string;
  initDataUnsafe: Record<string, any>;
  themeParams: ThemeParams;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  version: string;
  platform: string;
};

const TelegramContext = createContext<{ webApp?: WebApp }>({});

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [webApp, setWebApp] = useState<WebApp | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const app = (window as any).Telegram.WebApp as WebApp;
      app.ready();
      app.expand();
      setWebApp(app);

      const bg = app.themeParams.bg_color || "#ffffff";
      const txt = app.themeParams.text_color || "#000000";
      document.documentElement.style.setProperty("--tg-theme-bg-color", bg);
      document.documentElement.style.setProperty("--tg-theme-text-color", txt);
      document.documentElement.style.setProperty(
        "--tg-theme-secondary-bg-color",
        app.themeParams.secondary_bg_color || bg
      );
      document.documentElement.style.setProperty(
        "--tg-theme-button-color",
        app.themeParams.button_color || "#3390ec"
      );
      document.documentElement.style.setProperty(
        "--tg-theme-button-text-color",
        app.themeParams.button_text_color || "#ffffff"
      );
      document.documentElement.style.setProperty(
        "--tg-theme-hint-color",
        app.themeParams.hint_color || "#999999"
      );
    }
  }, []);

  return (
    <TelegramContext.Provider value={{ webApp }}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}
