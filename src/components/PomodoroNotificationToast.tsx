import React from 'react';
import { X, Play, Bell, Sparkles } from 'lucide-react';
import { PomodoroMode } from '../types';

export interface PomodoroNotificationData {
  isOpen: boolean;
  title: string;
  message: string;
  mode: PomodoroMode;
  nextMode: PomodoroMode;
  nextMinutes: number;
}

interface PomodoroNotificationToastProps {
  data: PomodoroNotificationData | null;
  onClose: () => void;
  onStartNext: () => void;
}

export const PomodoroNotificationToast: React.FC<PomodoroNotificationToastProps> = ({
  data,
  onClose,
  onStartNext,
}) => {
  if (!data || !data.isOpen) return null;

  const isBreakFinished = data.mode !== 'focus';

  return (
    <div
      className="fixed inset-x-4 top-4 sm:top-6 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 animate-bounce-short"
      dir="rtl"
    >
      <div className="bg-white/95 backdrop-blur-xl border border-neutral-200/90 shadow-2xl rounded-2xl p-4 sm:p-5 text-neutral-900 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isBreakFinished
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-neutral-900 text-white shadow-neutral-900/20'
              }`}
            >
              {isBreakFinished ? <Sparkles className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 leading-tight">
                {data.title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1 leading-snug">
                {data.message}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer"
          >
            بستن
          </button>
          <button
            onClick={onStartNext}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 text-white shadow-sm transition-all cursor-pointer ${
              isBreakFinished
                ? 'bg-neutral-900 hover:bg-neutral-800'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              شروع {data.nextMode === 'focus' ? 'تمرکز' : 'استراحت'} ({data.nextMinutes} دقیقه)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
