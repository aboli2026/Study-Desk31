import React, { useRef, useCallback } from 'react';

interface AppleCapsuleSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  color?: string;
  unit?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const AppleCapsuleSlider: React.FC<AppleCapsuleSliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  unit,
  leftIcon,
  rightIcon,
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const updateValueFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const rawVal = min + ratio * (max - min);
      const steppedVal = Math.round(rawVal / step) * step;
      const clampedVal = Math.max(min, Math.min(max, steppedVal));
      onChange(clampedVal);
    },
    [min, max, step, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateValueFromPointer(e.clientX);

    const onPointerMove = (moveEvt: PointerEvent) => {
      updateValueFromPointer(moveEvt.clientX);
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      try {
        (e.target as HTMLElement).releasePointerCapture(upEvt.pointerId);
      } catch {}
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div className={`w-full flex items-center gap-3 select-none ${className}`}>
      {leftIcon && <div className="shrink-0">{leftIcon}</div>}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        className="relative flex-1 h-9 bg-neutral-200/80 rounded-full overflow-hidden cursor-pointer touch-none shadow-inner transition-all hover:bg-neutral-200"
      >
        {/* Fill bar */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-neutral-900 rounded-full transition-all duration-75"
          style={{ width: `${percentage}%` }}
        />
        {/* Thumb indicator knob */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-white rounded-full shadow-md border border-neutral-300 pointer-events-none transition-all duration-75"
          style={{ left: `${percentage}%` }}
        />
      </div>
      {rightIcon && <div className="shrink-0">{rightIcon}</div>}
      {unit && (
        <span className="text-xs font-mono font-bold text-neutral-600 min-w-8 text-left tabular-nums">
          {Math.round(value)}{unit}
        </span>
      )}
    </div>
  );
};
