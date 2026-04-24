import React, { useEffect } from 'react';
import { useProgress } from '../hooks/useProgress';
import { LanguageToggle } from '../components/LanguageToggle';
import type { Screen } from '../types';
import { isTelegramWebApp } from '../utils/telegram';

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const progress = useProgress();
  const settings = progress.progress.settings;
  const [localTime, setLocalTime] = React.useState(settings.reminderTime);
  const [reminderEnabled, setReminderEnabled] = React.useState(settings.reminderEnabled);

  // Setup back button
  useEffect(() => {
    if (isTelegramWebApp()) {
      const handleBack = () => onNavigate('home');
      window.Telegram!.WebApp.BackButton.show();
      window.Telegram!.WebApp.BackButton.onClick(handleBack);
      return () => {
        window.Telegram!.WebApp.BackButton.offClick(handleBack);
        window.Telegram!.WebApp.BackButton.hide();
      };
    }
  }, [onNavigate]);

  const handleSave = () => {
    progress.updateSettings({
      reminderEnabled,
      reminderTime: localTime,
    });
    onNavigate('home');
  };

  return (
    <div className="settings-screen">
      <h1>Настройки</h1>

      <div className="settings-section">
        <h2>Язык</h2>
        <LanguageToggle
          mode={settings.languageMode}
          onChange={(mode) => progress.updateSettings({ languageMode: mode })}
        />
        <p className="settings-hint">Рекомендуется ES + RU для подготовки к экзамену</p>
      </div>

      <div className="settings-section">
        <h2>Напоминания</h2>
        <div className="setting-row">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
            />
            <span>Ежедневные напоминания</span>
          </label>
        </div>
        {reminderEnabled && (
          <div className="setting-row">
            <label className="setting-label">
              Время напоминания:
              <input
                type="time"
                value={localTime}
                onChange={(e) => setLocalTime(e.target.value)}
              />
            </label>
          </div>
        )}
        <p className="settings-hint">Часовой пояс: America/Argentina/Buenos_Aires</p>
      </div>

      <button className="save-btn" onClick={handleSave}>
        Сохранить
      </button>
    </div>
  );
};
