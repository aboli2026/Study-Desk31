import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EyeComfortSettings, DrawingStroke, StickyNoteItem, DrawingPoint } from '../types';
import { StickyNote, Trash2, Edit3 } from 'lucide-react';

export interface PdfPageProps {
  pdfDoc: any;
  pageNumber: number;
  scale: number;
  isFitMode?: boolean;
  eyeComfortSettings: EyeComfortSettings;
  onVisible?: (pageNumber: number) => void;
  activeTool: string;
  eraserMode?: 'stroke' | 'pixel' | 'area' | 'object';
  eraserSize?: number;
  penColor?: string;
  penWidth?: number;
  highlighterColor?: string;
  highlighterWidth?: number;
  autoStraighten?: boolean;
  rulerColor?: string;
  rulerWidth?: number;
  rulerLock90?: boolean;
  strokes?: DrawingStroke[];
  onAddStroke?: (pageNumber: number, stroke: DrawingStroke) => void;
  onUpdateStroke?: (pageNum: number, strokeId: string, updatedStroke: DrawingStroke) => void;
  onDeleteStroke?: (pageNumber: number, strokeId: string) => void;
  onDeleteStrokes?: (pageNumber: number, strokeIds: string[]) => void;
  onClearPageAnnotations?: (pageNumber: number) => void;
  stickyNotes?: StickyNoteItem[];
  onAddStickyNote?: (pageNumber: number, x: number, y: number) => void;
  onMoveStickyNote?: (noteId: string, pageNumber: number, newX: number, newY: number) => void;
  onDeleteStickyNote?: (id: string) => void;
  onOpenStickyNote?: (note: StickyNoteItem) => void;
  selectedItem?: any;
  onSelectItem?: (item: any) => void;
}

export const PdfPage: React.FC<PdfPageProps> = ({
  pdfDoc,
  pageNumber,
  scale,
  eyeComfortSettings,
  onVisible,
  activeTool,
  eraserSize = 16,
  penColor = '#000000',
  penWidth = 2,
  highlighterColor = '#fef08a',
  highlighterWidth = 14,
  autoStraighten = false,
  rulerColor = '#0284c7',
  rulerWidth = 2,
  rulerLock90 = false,
  strokes = [],
  onAddStroke,
  onDeleteStroke,
  stickyNotes = [],
  onAddStickyNote,
  onMoveStickyNote,
  onDeleteStickyNote,
  onOpenStickyNote,
  selectedItem,
  onSelectItem,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 800,
  });

  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const isDrawingRef = useRef(false);

  // Setup IntersectionObserver for current visible page tracking
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            onVisible(pageNumber);
          }
        });
      },
      { threshold: [0.35, 0.7] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, onVisible]);

  // Render PDF page to Canvas
  useEffect(() => {
    let cancelRender = false;
    let renderTask: any = null;

    const render = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelRender) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: scale * dpr });
        const cssWidth = Math.round(viewport.width / dpr);
        const cssHeight = Math.round(viewport.height / dpr);

        setDimensions({ width: cssWidth, height: cssHeight });

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Error rendering page ${pageNumber}:`, err);
        }
      }
    };

    render();

    return () => {
      cancelRender = true;
      if (renderTask && renderTask.cancel) {
        try {
          renderTask.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  // Pointer event handlers for drawing and note placement
  const getPointerPos = useCallback(
    (e: React.PointerEvent): { x: number; y: number } => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'hand') return;

    if (activeTool === 'stickyNote') {
      const pos = getPointerPos(e);
      if (onAddStickyNote) {
        onAddStickyNote(pageNumber, Math.round(pos.x), Math.round(pos.y));
      }
      return;
    }

    if (activeTool === 'eraser') {
      return;
    }

    if (['pen', 'highlighter', 'ruler'].includes(activeTool)) {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      isDrawingRef.current = true;
      const pos = getPointerPos(e);

      let toolType: 'pen' | 'highlighter' | 'ruler' = 'pen';
      let strokeColor = penColor;
      let strokeWidth = penWidth;
      let opacity = 1;

      if (activeTool === 'highlighter') {
        toolType = 'highlighter';
        strokeColor = highlighterColor;
        strokeWidth = highlighterWidth;
        opacity = 0.45;
      } else if (activeTool === 'ruler') {
        toolType = 'ruler';
        strokeColor = rulerColor;
        strokeWidth = rulerWidth;
      }

      const initialStroke: DrawingStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tool: toolType,
        color: strokeColor,
        width: strokeWidth,
        opacity,
        points: [pos],
      };

      setCurrentStroke(initialStroke);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawingRef.current || !currentStroke) return;

    const pos = getPointerPos(e);

    if (currentStroke.tool === 'ruler') {
      // Ruler creates straight lines
      const startPt = currentStroke.points[0];
      let endX = pos.x;
      let endY = pos.y;

      if (rulerLock90) {
        const dx = Math.abs(endX - startPt.x);
        const dy = Math.abs(endY - startPt.y);
        if (dx > dy) {
          endY = startPt.y;
        } else {
          endX = startPt.x;
        }
      }

      setCurrentStroke({
        ...currentStroke,
        points: [startPt, { x: endX, y: endY }],
      });
      return;
    }

    setCurrentStroke((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, pos],
      };
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawingRef.current || !currentStroke) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    isDrawingRef.current = false;

    if (currentStroke.points.length > 1) {
      let finalStroke = currentStroke;

      // Auto-straighten if enabled and drawn roughly straight
      if (autoStraighten && currentStroke.points.length > 4) {
        const p1 = currentStroke.points[0];
        const p2 = currentStroke.points[currentStroke.points.length - 1];
        finalStroke = {
          ...currentStroke,
          points: [p1, p2],
        };
      }

      if (onAddStroke) {
        onAddStroke(pageNumber, finalStroke);
      }
    }

    setCurrentStroke(null);
  };

  const handleStrokeClick = (e: React.MouseEvent, strokeId: string) => {
    if (activeTool === 'eraser' && onDeleteStroke) {
      e.stopPropagation();
      onDeleteStroke(pageNumber, strokeId);
    }
  };

  // Convert points array to SVG path data
  const renderPathData = (points: DrawingPoint[]): string => {
    if (!points || points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      d += ` Q ${p1.x} ${p1.y}, ${midX} ${midY}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  };

  // Calculate eye comfort filter
  const getFilterStyle = () => {
    const { colorMode, warmth } = eyeComfortSettings;
    const filters: string[] = [];

    if (colorMode === 'yellow') {
      filters.push(`sepia(${warmth}%) saturate(${100 + warmth * 0.4}%)`);
    } else if (colorMode === 'sepia') {
      filters.push('sepia(70%)');
    } else if (colorMode === 'grayscale') {
      filters.push('grayscale(100%)');
    } else if (colorMode === 'dark') {
      filters.push('invert(90%) hue-rotate(180deg)');
    }

    return filters.length > 0 ? filters.join(' ') : 'none';
  };

  return (
    <div
      ref={containerRef}
      id={`pdf-page-${pageNumber}`}
      className="relative my-3 bg-white shadow-lg rounded-sm transition-shadow hover:shadow-xl overflow-hidden select-none"
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
    >
      {/* 1. Base Canvas Render of PDF */}
      <canvas
        ref={canvasRef}
        className="block pointer-events-none"
        style={{
          filter: getFilterStyle(),
          willChange: 'filter',
        }}
      />

      {/* 2. SVG Overlay for Inks & Highlighter Strokes */}
      <svg
        className={`absolute inset-0 w-full h-full ${
          ['pen', 'highlighter', 'ruler'].includes(activeTool)
            ? 'cursor-crosshair'
            : activeTool === 'stickyNote'
            ? 'cursor-cell'
            : activeTool === 'eraser'
            ? 'cursor-pointer'
            : 'pointer-events-none'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Render Saved Strokes */}
        {strokes.map((s) => {
          const isHighlighter = s.tool === 'highlighter';
          return (
            <path
              key={s.id}
              d={renderPathData(s.points)}
              stroke={s.color}
              strokeWidth={s.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={s.opacity ?? (isHighlighter ? 0.45 : 1)}
              style={{
                mixBlendMode: isHighlighter ? 'multiply' : 'normal',
                pointerEvents: activeTool === 'eraser' ? 'stroke' : 'none',
              }}
              onClick={(e) => handleStrokeClick(e, s.id)}
            />
          );
        })}

        {/* Render Current Live Stroke */}
        {currentStroke && (
          <path
            d={renderPathData(currentStroke.points)}
            stroke={currentStroke.color}
            strokeWidth={currentStroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={currentStroke.opacity ?? (currentStroke.tool === 'highlighter' ? 0.45 : 1)}
            style={{
              mixBlendMode: currentStroke.tool === 'highlighter' ? 'multiply' : 'normal',
              pointerEvents: 'none',
            }}
          />
        )}
      </svg>

      {/* 3. Sticky Notes Overlay */}
      {stickyNotes.map((note) => {
        const isSelected = selectedItem?.type === 'note' && selectedItem?.id === note.id;
        return (
          <div
            key={note.id}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectItem) onSelectItem({ type: 'note', id: note.id });
              if (onOpenStickyNote) onOpenStickyNote(note);
            }}
            className={`absolute group cursor-pointer transition-transform hover:scale-105 select-none rounded-xl shadow-md p-2 max-w-[180px] border border-black/10 ${
              isSelected ? 'ring-2 ring-neutral-900 ring-offset-2' : ''
            }`}
            style={{
              left: `${note.x}px`,
              top: `${note.y}px`,
              backgroundColor: note.color || '#fef08a',
              color: note.textColor || '#713f12',
            }}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold truncate">
                {note.title || 'استیکی‌نوت'}
              </span>
              <StickyNote className="w-3.5 h-3.5 shrink-0 opacity-70" />
            </div>
            {note.content && (
              <p className="text-[10px] line-clamp-2 leading-tight">
                {note.content}
              </p>
            )}
          </div>
        );
      })}

      {/* 4. Page Number Indicator Watermark (Corner badge) */}
      <div className="absolute bottom-2 left-2 text-[10px] font-mono text-neutral-400 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-2xs pointer-events-none">
        {pageNumber}
      </div>
    </div>
  );
};
