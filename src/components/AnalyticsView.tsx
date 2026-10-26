import React, { useState, useMemo } from 'react';
import {
  Flame,
  Clock,
  Sparkles,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronLeft,
  Target,
  Edit3,
  X,
  Check,
  Plus,
  Minus,
  Trophy,
} from 'lucide-react';
import { PomodoroSession, NoteItem } from '../types';

interface AnalyticsViewProps {
  sessions: PomodoroSession[];
  notes: NoteItem[];
  onClearHistory: () => void;
  onLoadSampleData?: () => void;
}

type TimeFrame = 'today' | 'week' | 'all';

const GOAL_STORAGE_KEY = 'study_analytics_daily_goal_hours';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  sessions,
  notes,
  onClearHistory,
  onLoadSampleData,
}) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('week');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Daily Study Target Goal State (ساعت هدف روزانه ذخیره‌شده در حافظه محلی)
  const [dailyGoalHours, setDailyGoalHours] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(GOAL_STORAGE_KEY);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return 2;
  });

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [tempGoalInput, setTempGoalInput] = useState<number>(dailyGoalHours);

  const handleSaveGoal = (hours: number) => {
    const safeHours = Math.max(0.5, Math.min(16, Number(hours.toFixed(1))));
    setDailyGoalHours(safeHours);
    try {
      localStorage.setItem(GOAL_STORAGE_KEY, safeHours.toString());
    } catch {}
    setIsGoalModalOpen(false);
  };

  // Helper to identify focused study sessions
  const isStudy = (s: PomodoroSession) =>
    s.type === 'focus' ||
    s.type === 'file-study' ||
    s.type === 'app-usage' ||
    (s.type !== 'short-break' && s.type !== 'long-break');

  const getSessionDate = (s: PomodoroSession): Date => {
    if (s.createdAt) return new Date(s.createdAt);
    if (s.timestamp) {
      const d = new Date(s.timestamp);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  // Filtered sessions based on timeframe
  const filteredSessions = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return sessions.filter((s) => {
      const d = getSessionDate(s);
      if (timeFrame === 'today') {
        return d >= todayStart;
      }
      if (timeFrame === 'week') {
        return d.getTime() >= now - 7 * 86400000;
      }
      return true;
    });
  }, [sessions, timeFrame]);

  const studySessions = useMemo(() => filteredSessions.filter(isStudy), [filteredSessions]);
  const breakSessions = useMemo(() => filteredSessions.filter((s) => !isStudy(s)), [filteredSessions]);

  // Total Focus Minutes in active timeframe
  const focusMinutes = useMemo(() => {
    return studySessions.reduce((acc, s) => acc + (s.durationMinutes || 25), 0);
  }, [studySessions]);

  const breakMinutes = useMemo(() => {
    return breakSessions.reduce((acc, s) => acc + (s.durationMinutes || 5), 0);
  }, [breakSessions]);

  const focusHours = Math.floor(focusMinutes / 60);
  const remainingMinutes = focusMinutes % 60;

  // Streak Calculation across all-time history
  const streakDays = useMemo(() => {
    const allStudy = sessions.filter(isStudy);
    if (allStudy.length === 0) return 0;

    const uniqueDates = new Set<string>();
    allStudy.forEach((s) => {
      const d = getSessionDate(s);
      if (!isNaN(d.getTime())) {
        uniqueDates.add(d.toISOString().slice(0, 10));
      }
    });

    const sorted = Array.from(uniqueDates).sort().reverse();
    if (sorted.length === 0) return 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (sorted[0] !== todayStr && sorted[0] !== yesterday) return 0;

    let streak = 0;
    let check = new Date(sorted[0]);

    for (let i = 0; i < sorted.length; i++) {
      const exp = check.toISOString().slice(0, 10);
      if (sorted.includes(exp)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [sessions]);

  // Average session length
  const averageSessionDuration = useMemo(() => {
    if (studySessions.length === 0) return 0;
    return Math.round(focusMinutes / studySessions.length);
  }, [studySessions.length, focusMinutes]);

  // Note words
  const totalNoteWords = useMemo(() => {
    return notes.reduce((acc, note) => {
      const words = (note.content || '').trim().split(/\s+/).filter(Boolean);
      return acc + words.length;
    }, 0);
  }, [notes]);

  // Record calculation: highest total focus minutes achieved in a single day across all sessions
  const recordStudy = useMemo(() => {
    const allStudy = sessions.filter(isStudy);
    if (allStudy.length === 0) return { minutes: 0, hours: 0, remMinutes: 0 };

    const dayMap: Record<string, number> = {};
    allStudy.forEach((s) => {
      const d = getSessionDate(s);
      if (!isNaN(d.getTime())) {
        const key = d.toISOString().slice(0, 10);
        dayMap[key] = (dayMap[key] || 0) + (s.durationMinutes || 25);
      }
    });

    const values = Object.values(dayMap);
    const maxMins = values.length > 0 ? Math.max(...values) : 0;
    return {
      minutes: maxMins,
      hours: Math.floor(maxMins / 60),
      remMinutes: maxMins % 60,
    };
  }, [sessions]);

  // Iranian weekly data (شنبه تا جمعه)
  const persianWeekDays = useMemo(() => [
    { name: 'شنبه', short: 'ش', index: 0 },
    { name: 'یکشنبه', short: 'ی', index: 1 },
    { name: 'دوشنبه', short: 'د', index: 2 },
    { name: 'سه‌شنبه', short: 'س', index: 3 },
    { name: 'چهارشنبه', short: 'چ', index: 4 },
    { name: 'پنجشنبه', short: 'پ', index: 5 },
    { name: 'جمعه', short: 'ج', index: 6 },
  ], []);

  const currentJsDay = new Date().getDay();
  const currentPersianIndex = (currentJsDay + 1) % 7;

  const weeklyPills = useMemo(() => {
    const map = persianWeekDays.map((d) => ({
      ...d,
      minutes: 0,
      sessions: 0,
      isToday: d.index === currentPersianIndex,
    }));

    const sevenDaysAgo = Date.now() - 7 * 86400000;

    sessions.forEach((s) => {
      if (!isStudy(s)) return;
      const d = getSessionDate(s);
      if (d.getTime() >= sevenDaysAgo || sessions.length <= 15) {
        const pIndex = (d.getDay() + 1) % 7;
        const target = map.find((item) => item.index === pIndex);
        if (target) {
          target.minutes += s.durationMinutes || 25;
          target.sessions += 1;
        }
      }
    });

    const max = Math.max(...map.map((m) => m.minutes), 60);
    return { list: map, maxMinutes: max };
  }, [sessions, persianWeekDays, currentPersianIndex]);

  // Productivity ratio
  const totalMinutes = focusMinutes + breakMinutes;
  const productivityPercentage = totalMinutes > 0 ? Math.round((focusMinutes / totalMinutes) * 100) : 100;

  // Target comparison dynamically calculated from customized daily study goal
  const targetMinutes = useMemo(() => {
    if (timeFrame === 'today') return Math.max(30, Math.round(dailyGoalHours * 60));
    if (timeFrame === 'week') return Math.max(120, Math.round(dailyGoalHours * 7 * 60));
    return Math.max(600, Math.round(dailyGoalHours * 30 * 60));
  }, [timeFrame, dailyGoalHours]);

  const targetProgress = Math.min(100, Math.round((focusMinutes / targetMinutes) * 100));

  const toFa = (val: number | string) => Number(val).toLocaleString('fa-IR');

  return (
    <div
      className="h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto bg-neutral-50/70 select-none font-sans text-neutral-900"
      dir="rtl"
    >
      <div className="max-w-4xl w-full mx-auto space-y-5 sm:space-y-6">

        {/* =====================================================================
            1. HEADER & CONTROLS (هماهنگ با سبک میز مطالعه و کتابخانه)
            ===================================================================== */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              تحلیل و ریتم مطالعه
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              گزارش عملکرد، استمرار روزانه و ارزیابی زمان‌های مفید تمرکز
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Segmented Timeframe Switcher with visible modern shadows */}
            <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 bg-neutral-100/90 rounded-2xl shadow-inner text-xs shrink-0 select-none">
              <button
                type="button"
                onClick={() => setTimeFrame('today')}
                className={`px-3.5 sm:px-4 py-1.5 rounded-xl transition-all duration-200 text-center whitespace-nowrap cursor-pointer ios-spring-btn ${
                  timeFrame === 'today'
                    ? 'bg-white text-neutral-900 font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/60 font-medium'
                }`}
              >
                امروز
              </button>
              <button
                type="button"
                onClick={() => setTimeFrame('week')}
                className={`px-3.5 sm:px-4 py-1.5 rounded-xl transition-all duration-200 text-center whitespace-nowrap cursor-pointer ios-spring-btn ${
                  timeFrame === 'week'
                    ? 'bg-white text-neutral-900 font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/60 font-medium'
                }`}
              >
                ۷ روز اخیر
              </button>
              <button
                type="button"
                onClick={() => setTimeFrame('all')}
                className={`px-3.5 sm:px-4 py-1.5 rounded-xl transition-all duration-200 text-center whitespace-nowrap cursor-pointer ios-spring-btn ${
                  timeFrame === 'all'
                    ? 'bg-white text-neutral-900 font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/60 font-medium'
                }`}
              >
                کل تاریخچه
              </button>
            </div>

            {/* Goal Selector & Customizer Button */}
            <button
              type="button"
              onClick={() => {
                setTempGoalInput(dailyGoalHours);
                setIsGoalModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-all cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] group shrink-0"
              title="تنظیم و انتخاب هدف مطالعه روزانه"
            >
              <Target className="w-3.5 h-3.5 text-rose-500 transition-transform group-hover:scale-110" />
              <span className="hidden xs:inline">هدف:</span>
              <span>{toFa(dailyGoalHours)} ساعت</span>
            </button>

            {/* Clear History Button */}
            {sessions.length > 0 && (
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="p-2.5 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-600 hover:text-red-600 shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] transition-all ios-spring-btn"
                title="شروع مجدد و بازنشانی"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* =====================================================================
            GLOBAL ANIMATED CONTAINER (انیمیشن نرم سراسری هنگام تغییر بازه زمانی)
            ===================================================================== */}
        <div key={timeFrame} className="animate-timeframe-change space-y-5 sm:space-y-6">

        {/* =====================================================================
            2. HERO FOCUS CARD (رینگ تمرکز + شاخص‌های سه‌گانه با رنگ‌بندی هماهنگ و سایه مدرن)
            ===================================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
            
            {/* Center: Clean Progress Ring */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  {/* Background Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    stroke="#f3f4f6"
                    strokeWidth="11"
                    fill="none"
                  />
                  {/* Active Progress Stroke */}
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    stroke="#171717"
                    strokeWidth="11"
                    strokeDasharray={2 * Math.PI * 68}
                    strokeDashoffset={2 * Math.PI * 68 * (1 - targetProgress / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                    fill="none"
                  />
                </svg>

                {/* Inner Stat */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
                    {focusHours > 0
                      ? `${toFa(focusHours)}:${toFa(remainingMinutes.toString().padStart(2, '0'))}`
                      : toFa(remainingMinutes)}
                  </span>
                  <span className="text-xs font-medium text-neutral-500 mt-0.5">
                    {focusHours > 0 ? 'ساعت تمرکز مفید' : 'دقیقه تمرکز'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Three Key Metric Columns & Balance Bar */}
            <div className="md:col-span-7 flex flex-col justify-center space-y-5">
              
              <div className="grid grid-cols-3 gap-3 sm:gap-4 pb-3">
                {/* Metric 1: Exact Study Duration (مدت زمان دقیق مطالعه) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_18px_rgba(0,0,0,0.08)] transition-all">
                  <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span className="truncate">زمان دقیق</span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-neutral-900 tabular-nums">
                    {focusHours > 0 ? (
                      <>
                        {toFa(focusHours)}
                        <span className="text-xs font-semibold text-neutral-400 mx-0.5">:</span>
                        {toFa(remainingMinutes.toString().padStart(2, '0'))}
                        <span className="text-xs font-normal text-neutral-400 mr-1">ساعت</span>
                      </>
                    ) : (
                      <>
                        {toFa(focusMinutes)}
                        <span className="text-xs font-normal text-neutral-400 mr-1">دقیقه</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                    {focusHours > 0 ? `${toFa(focusMinutes)} دقیقه مجموع` : 'مطالعه مفید'}
                  </p>
                </div>

                {/* Metric 2: Streak (استمرار) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_18px_rgba(0,0,0,0.08)] transition-all">
                  <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span className="truncate">استمرار</span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-neutral-900">
                    {toFa(streakDays)}
                    <span className="text-xs font-normal text-neutral-400 mr-1">روز</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 truncate">پیوسته</p>
                </div>

                {/* Metric 3: Record (رکورد) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_18px_rgba(0,0,0,0.08)] transition-all">
                  <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-600" />
                    <span className="truncate">رکورد</span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-neutral-900 tabular-nums">
                    {recordStudy.hours > 0 ? (
                      <>
                        {toFa(recordStudy.hours)}
                        <span className="text-xs font-semibold text-neutral-400 mx-0.5">:</span>
                        {toFa(recordStudy.remMinutes.toString().padStart(2, '0'))}
                        <span className="text-xs font-normal text-neutral-400 mr-1">ساعت</span>
                      </>
                    ) : (
                      <>
                        {toFa(recordStudy.minutes)}
                        <span className="text-xs font-normal text-neutral-400 mr-1">دقیقه</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 truncate">بهترین روز</p>
                </div>
              </div>

              {/* Productivity Ratio Bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-600 mb-2">
                  <span className="font-semibold text-neutral-800">شاخص تمرکز خالص</span>
                  <span className="font-mono font-medium">{toFa(productivityPercentage)}٪</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-neutral-100 shadow-inner overflow-hidden flex">
                  <div
                    style={{ width: `${productivityPercentage}%` }}
                    className="h-full bg-neutral-900 rounded-full transition-all duration-500 shadow-xs"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2">
                  <span>{toFa(focusMinutes)} دقیقه مطالعه مفید</span>
                  <span>{toFa(breakMinutes)} دقیقه استراحت</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* =====================================================================
            3. WEEKLY HORIZON (افق ۷ روزه با کارت‌های هماهنگ و سایه‌دار مدرن)
            ===================================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <h2 className="text-sm sm:text-base font-bold text-neutral-900">
                افق ریتم مطالعه در طول هفته
              </h2>
            </div>
            <span className="text-xs text-neutral-400">شنبه تا جمعه</span>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {weeklyPills.list.map((day) => {
              const isSelected = selectedDayIndex === day.index;
              const ratio = Math.min(100, (day.minutes / weeklyPills.maxMinutes) * 100);

              return (
                <button
                  key={day.index}
                  type="button"
                  onClick={() => setSelectedDayIndex(isSelected ? null : day.index)}
                  className={`flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all text-center cursor-pointer ${
                    day.isToday
                      ? 'bg-neutral-900 text-white shadow-[0_8px_20px_rgba(23,23,23,0.3)] scale-[1.03]'
                      : isSelected
                      ? 'bg-neutral-200 text-neutral-900 shadow-md'
                      : 'bg-neutral-50/90 hover:bg-white text-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]'
                  }`}
                >
                  {/* Day Label */}
                  <span
                    className={`text-xs font-semibold ${
                      day.isToday ? 'text-white' : 'text-neutral-700'
                    }`}
                  >
                    <span className="hidden sm:inline">{day.name}</span>
                    <span className="sm:hidden">{day.short}</span>
                  </span>

                  {/* Level Pill */}
                  <div
                    className={`w-2.5 sm:w-3 h-12 rounded-full my-2.5 p-0.5 flex items-end ${
                      day.isToday ? 'bg-neutral-800' : 'bg-neutral-200/80'
                    }`}
                  >
                    <div
                      style={{ height: `${Math.max(12, ratio)}%` }}
                      className={`w-full rounded-full transition-all duration-300 ${
                        day.isToday
                          ? 'bg-white'
                          : day.minutes > 0
                          ? 'bg-neutral-800'
                          : 'bg-transparent'
                      }`}
                    />
                  </div>

                  {/* Minutes Label */}
                  <span
                    className={`text-[10px] font-medium ${
                      day.isToday ? 'text-neutral-200' : 'text-neutral-500'
                    }`}
                  >
                    {day.minutes > 0 ? toFa(day.minutes) : '—'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Day Detail Expansion */}
          {selectedDayIndex !== null && (
            <div className="mt-4 p-4 rounded-2xl bg-neutral-50/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center justify-between text-xs text-neutral-600 px-4">
              <span>
                گزارش {weeklyPills.list[selectedDayIndex].name}:{' '}
                <strong className="text-neutral-900 font-bold">
                  {toFa(weeklyPills.list[selectedDayIndex].minutes)} دقیقه تمرکز
                </strong>{' '}
                در {toFa(weeklyPills.list[selectedDayIndex].sessions)} نشست
              </span>
              <button
                type="button"
                onClick={() => setSelectedDayIndex(null)}
                className="text-xs text-neutral-400 hover:text-neutral-700 font-medium cursor-pointer"
              >
                بستن
              </button>
            </div>
          )}
        </section>

        {/* =====================================================================
            4. RECENT ACTIVITY FLOW (جریان نشست‌های اخیر با کارت‌های نرم و مدرن)
            ===================================================================== */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-neutral-900">
              جریان اخیر فعالیت‌ها
            </h2>
            {onLoadSampleData && sessions.length === 0 && (
              <button
                type="button"
                onClick={onLoadSampleData}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl text-neutral-700 bg-neutral-100 hover:bg-neutral-200 shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                درج داده‌های نمونه
              </button>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-2 shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-neutral-600">
                هنوز رویدادی ثبت نشده است
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                با شروع تایمر پومودورو یا باز کردن اسناد، آمار مطالعه در این بخش به‌روز خواهد شد.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sessions.slice(0, 5).map((session, i) => {
                const isFoc = isStudy(session);
                const sDate = getSessionDate(session);
                const timeStr = !isNaN(sDate.getTime())
                  ? sDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
                  : '';
                const dateStr = !isNaN(sDate.getTime())
                  ? sDate.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
                  : '';

                return (
                  <div key={session.id || i} className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50/70 hover:bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shadow-xs ${
                          isFoc ? 'bg-emerald-500' : 'bg-neutral-300'
                        }`}
                      />
                      <div>
                        <p className="font-semibold text-neutral-900">
                          {session.fileName
                            ? `مطالعه فایل ${session.fileName}`
                            : isFoc
                            ? 'نشست تمرکز پومودورو'
                            : 'استراحت و بازیابی ذهن'}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {dateStr} • ساعت {timeStr}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          isFoc
                            ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
                            : 'bg-neutral-200/70 text-neutral-600 font-medium'
                        }`}
                      >
                        {toFa(session.durationMinutes || 25)} دقیقه
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        </div>

        {/* =====================================================================
            5. RESET CONFIRMATION MODAL
            ===================================================================== */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
            <div className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] space-y-4">
              <h3 className="font-bold text-sm text-neutral-900">بازنشانی تاریخچه مطالعه</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                تمام نشست‌های ثبت‌شده پاکسازی خواهند شد. آیا از ادامه اطمینان دارید؟
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-medium rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearHistory();
                    setShowResetModal(false);
                  }}
                  className="px-3.5 py-1.5 text-xs rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 shadow-sm transition-colors cursor-pointer"
                >
                  حذف تاریخچه
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            6. STUDY GOAL SELECTION MODAL (مودال انتخاب و تنظیم هدف مطالعه)
            ===================================================================== */}
        {isGoalModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
            dir="rtl"
          >
            <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] space-y-5 animate-scale-up">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 shadow-sm flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 leading-tight">
                      انتخاب هدف مطالعه
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      تنظیم ساعت تمرکز روزانه برای سنجش پیشرفت و پر شدن رینگ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                  اهداف پیشنهادی روزانه:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { hours: 1, label: '۱ ساعت', desc: 'سبک و روزمره', icon: '🌱' },
                    { hours: 2, label: '۲ ساعت', desc: 'استاندارد و متعادل', icon: '🎯' },
                    { hours: 3, label: '۳ ساعت', desc: 'جدی و پربازده', icon: '⚡' },
                    { hours: 4, label: '۴ ساعت', desc: 'کنکور / امتحانات', icon: '🔥' },
                    { hours: 6, label: '۶ ساعت', desc: 'فشرده و تخصصی', icon: '🚀' },
                    { hours: 8, label: '۸ ساعت', desc: 'ماراتن مطالعه روزانه', icon: '🏆' },
                  ].map((preset) => {
                    const isSelected = tempGoalInput === preset.hours;
                    return (
                      <button
                        key={preset.hours}
                        type="button"
                        onClick={() => setTempGoalInput(preset.hours)}
                        className={`p-3.5 rounded-2xl text-right transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-neutral-900 text-white shadow-[0_8px_20px_rgba(23,23,23,0.3)] scale-[1.02]'
                            : 'bg-neutral-50/90 hover:bg-white text-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <span>{preset.icon}</span>
                            <span>{preset.label}</span>
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span
                          className={`text-[10px] ${
                            isSelected ? 'text-neutral-300' : 'text-neutral-500'
                          }`}
                        >
                          {preset.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Target Stepper */}
              <div className="p-4 rounded-2xl bg-neutral-50/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700">هدف دلخواه روزانه:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTempGoalInput((prev) => Math.max(0.5, Number((prev - 0.5).toFixed(1))))}
                      className="w-8 h-8 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_10px_rgba(0,0,0,0.1)] font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95"
                      title="کاهش نیم ساعت"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-base font-extrabold text-neutral-900 min-w-18 text-center tabular-nums font-mono">
                      {toFa(tempGoalInput)} ساعت
                    </span>
                    <button
                      type="button"
                      onClick={() => setTempGoalInput((prev) => Math.min(16, Number((prev + 0.5).toFixed(1))))}
                      className="w-8 h-8 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_10px_rgba(0,0,0,0.1)] font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95"
                      title="افزایش نیم ساعت"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Equivalent Horizon Projection */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                  <span>معادل هفتگی: <strong className="text-neutral-800 font-bold">{toFa(Math.round(tempGoalInput * 7))} ساعت</strong></span>
                  <span>معادل ماهانه: <strong className="text-neutral-800 font-bold">{toFa(Math.round(tempGoalInput * 30))} ساعت</strong></span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-100 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveGoal(tempGoalInput)}
                  className="px-5 py-2 text-xs rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold transition-all shadow-md shadow-neutral-900/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>ذخیره و اعمال هدف</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
