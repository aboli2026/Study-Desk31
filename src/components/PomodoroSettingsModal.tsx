import React, { useState, useEffect } from 'react';
import { X, Volume2, Bell, Check, RotateCcw, Sparkles } from 'lucide-react';
import { PomodoroSettings, PomodoroSound } from '../types';
import { playMinimalPomodoroSound } from '../utils/pomodoroAudio';

interface PomodoroSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PomodoroSettings;
  onSave: (settings: PomodoroSettings) => void;
}

const SOUND_OPTIONS: { id: PomodoroSound; label: string }[] = [
  { id: 'crystal', label: 'بلورین (Crystal)' },
  { id: 'bell', label: 'زنگوله تبتی (Bell)' },
  { id: 'marimba', label: 'ماریمبا چوبی (Marimba)' },
  { id: 'soft', label: 'ملایم (Soft)' },
  { id: 'zen', label: 'کاسه تبتی ذن (Zen)' },
];

export const PomodoroSettingsModal: React.FC<PomodoroSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState<PomodoroSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleTestSound = (sound: PomodoroSound) => {
    playMinimalPomodoroSound(sound, localSettings.soundVolume);
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">تنظیمات پومودورو</h2>
              <p className="text-xs text-neutral-500">شخصی‌سازی زمان‌ها، صداها و چرخه تمرکز</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-500 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Durations */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-neutral-500 block uppercase tracking-wider">
            مدت زمان بخش‌ها (دقیقه)
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/70">
              <span className="text-xs font-medium text-neutral-600 block mb-1">زمان تمرکز</span>
              <input
                type="number"
                min={1}
                max={120}
                value={localSettings.focusDuration}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    focusDuration: Math.max(1, parseInt(e.target.value) || 25),
                  })
                }
                className="w-full text-center text-lg font-bold bg-white border border-neutral-200 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/70">
              <span className="text-xs font-medium text-neutral-600 block mb-1">استراحت کوتاه</span>
              <input
                type="number"
                min={1}
                max={30}
                value={localSettings.shortBreakDuration}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    shortBreakDuration: Math.max(1, parseInt(e.target.value) || 5),
                  })
                }
                className="w-full text-center text-lg font-bold bg-white border border-neutral-200 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/70">
              <span className="text-xs font-medium text-neutral-600 block mb-1">استراحت بلند</span>
              <input
                type="number"
                min={1}
                max={60}
                value={localSettings.longBreakDuration}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    longBreakDuration: Math.max(1, parseInt(e.target.value) || 15),
                  })
                }
                className="w-full text-center text-lg font-bold bg-white border border-neutral-200 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* Rounds */}
        <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70">
          <div>
            <span className="text-sm font-bold text-neutral-900 block">تعداد دور قبل از استراحت طولانی</span>
            <span className="text-xs text-neutral-500">پس از چند نوبت تمرکز، استراحت بلند فعال شود</span>
          </div>
          <div className="flex items-center gap-2">
            {[2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() =>
                  setLocalSettings({ ...localSettings, roundsBeforeLongBreak: num })
                }
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  localSettings.roundsBeforeLongBreak === num
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Sound Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              صدای پایان تایمر
            </label>
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-neutral-400" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={localSettings.soundVolume}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    soundVolume: parseFloat(e.target.value),
                  })
                }
                className="w-20 accent-neutral-900 cursor-pointer"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SOUND_OPTIONS.map((snd) => (
              <button
                key={snd.id}
                type="button"
                onClick={() => {
                  setLocalSettings({ ...localSettings, soundType: snd.id });
                  handleTestSound(snd.id);
                }}
                className={`p-3 rounded-2xl border text-right text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                  localSettings.soundType === snd.id
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span>{snd.label}</span>
                {localSettings.soundType === snd.id ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <label className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-neutral-900 block">شروع خودکار استراحت</span>
              <span className="text-[11px] text-neutral-500">پس از اتمام زمان مطالعه، استراحت آغاز شود</span>
            </div>
            <input
              type="checkbox"
              checked={localSettings.autoStartBreaks}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, autoStartBreaks: e.target.checked })
              }
              className="w-5 h-5 rounded-md accent-neutral-900 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-neutral-900 block">شروع خودکار مطالعه</span>
              <span className="text-[11px] text-neutral-500">پس از اتمام زمان استراحت، دور جدید آغاز شود</span>
            </div>
            <input
              type="checkbox"
              checked={localSettings.autoStartFocus}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, autoStartFocus: e.target.checked })
              }
              className="w-5 h-5 rounded-md accent-neutral-900 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50 cursor-pointer">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-neutral-500" />
              <div>
                <span className="text-xs font-bold text-neutral-900 block">اعلان مرورگر (Browser Notification)</span>
                <span className="text-[11px] text-neutral-500">نمایش پیام هشدار در صورت باز بودن تب‌های دیگر</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.browserNotifications}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  browserNotifications: e.target.checked,
                })
              }
              className="w-5 h-5 rounded-md accent-neutral-900 cursor-pointer"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <button
            type="button"
            onClick={() =>
              setLocalSettings({
                focusDuration: 25,
                shortBreakDuration: 5,
                longBreakDuration: 15,
                roundsBeforeLongBreak: 4,
                autoStartBreaks: false,
                autoStartFocus: false,
                soundType: 'crystal',
                soundVolume: 0.65,
                browserNotifications: true,
              })
            }
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی پیش‌فرض</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800 shadow-md cursor-pointer"
            >
              ذخیره تنظیمات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
