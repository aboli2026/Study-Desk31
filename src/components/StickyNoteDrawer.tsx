import React, { useState, useEffect } from 'react';
import { X, Trash2, Bold, Check, FileText, ChevronLeft, Sparkles, BookOpen } from 'lucide-react';
import { StickyNoteItem } from '../types';
import { cleanPastedMarkdown, hasMarkdownArtifacts } from '../utils/textCleaner';

interface StickyNoteDrawerProps {
  note: StickyNoteItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (note: StickyNoteItem) => void;
  onDelete: (id: string) => void;
  allNotes?: StickyNoteItem[];
  onSelectNote?: (note: StickyNoteItem) => void;
  onNavigateToPage?: (page: number) => void;
}

const NOTE_COLORS = [
  { bg: '#fef08a', text: '#713f12', name: 'زرد' },
  { bg: '#bbf7d0', text: '#14532d', name: 'سبز' },
  { bg: '#bae6fd', text: '#0c4a6e', name: 'آبی' },
  { bg: '#fbcfe8', text: '#831843', name: 'صورتی' },
  { bg: '#fed7aa', text: '#7c2d12', name: 'نارنجی' },
  { bg: '#e9d5ff', text: '#581c87', name: 'بنفش' },
];

export const StickyNoteDrawer: React.FC<StickyNoteDrawerProps> = ({
  note,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  allNotes = [],
  onSelectNote,
  onNavigateToPage,
}) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#fef08a');
  const [textColor, setTextColor] = useState('#713f12');
  const [isBold, setIsBold] = useState(false);
  const [viewTab, setViewTab] = useState<'edit' | 'list'>('edit');

  useEffect(() => {
    if (note) {
      setContent(note.content || '');
      setTitle(note.title || `استیکی‌نوت صفحه ${note.pageNumber}`);
      setColor(note.color || '#fef08a');
      setTextColor(note.textColor || '#713f12');
      setIsBold(!!note.isBold);
      setViewTab('edit');
    }
  }, [note]);

  if (!isOpen) return null;

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (note) {
      onUpdate({
        ...note,
        content: newContent,
        title,
        color,
        textColor,
        isBold,
        updatedAt: Date.now(),
      });
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (note) {
      onUpdate({
        ...note,
        content,
        title: newTitle,
        color,
        textColor,
        isBold,
        updatedAt: Date.now(),
      });
    }
  };

  const handleColorSelect = (bgColor: string, txtColor: string) => {
    setColor(bgColor);
    setTextColor(txtColor);
    if (note) {
      onUpdate({
        ...note,
        color: bgColor,
        textColor: txtColor,
        updatedAt: Date.now(),
      });
    }
  };

  const handleToggleBold = () => {
    const nextBold = !isBold;
    setIsBold(nextBold);
    if (note) {
      onUpdate({
        ...note,
        isBold: nextBold,
        updatedAt: Date.now(),
      });
    }
  };

  const handleCleanMarkdown = () => {
    const cleaned = cleanPastedMarkdown(content);
    handleContentChange(cleaned);
  };

  return (
    <div
      className="fixed inset-y-0 left-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-r border-neutral-200 flex flex-col animate-slide-right select-none"
      dir="rtl"
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewTab('edit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewTab === 'edit'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-200/60'
            }`}
          >
            یادداشت فعلی
          </button>
          <button
            onClick={() => setViewTab('list')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewTab === 'list'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-200/60'
            }`}
          >
            <span>همه نوت‌ها</span>
            <span className="bg-neutral-200 text-neutral-800 text-[10px] font-mono px-1.5 py-0.5 rounded-full">
              {allNotes.length}
            </span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-neutral-200/60 text-neutral-500 flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {viewTab === 'edit' ? (
        note ? (
          <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
            {/* Page number badge & navigate */}
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-1.5 font-semibold">
                <BookOpen className="w-3.5 h-3.5" />
                صفحه {note.pageNumber}
              </span>
              {onNavigateToPage && (
                <button
                  onClick={() => onNavigateToPage(note.pageNumber)}
                  className="text-neutral-700 hover:text-neutral-900 underline font-semibold cursor-pointer"
                >
                  پرش به این صفحه
                </button>
              )}
            </div>

            {/* Note Title Input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="عنوان استیکی‌نوت..."
                className="w-full font-bold text-sm text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            {/* Toolbar: Color picker & formatting */}
            <div className="flex items-center justify-between gap-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200/70">
              {/* Color swatches */}
              <div className="flex items-center gap-1.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.bg}
                    type="button"
                    onClick={() => handleColorSelect(c.bg, c.text)}
                    className="w-6 h-6 rounded-full border border-black/10 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                    style={{ backgroundColor: c.bg }}
                    title={c.name}
                  >
                    {color === c.bg && <Check className="w-3.5 h-3.5" style={{ color: c.text }} />}
                  </button>
                ))}
              </div>

              {/* Bold button & Clean markdown */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleToggleBold}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    isBold ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-200 text-neutral-700'
                  }`}
                  title="متن ضخیم"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                {hasMarkdownArtifacts(content) && (
                  <button
                    type="button"
                    onClick={handleCleanMarkdown}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center gap-1 cursor-pointer"
                    title="حذف کدهای اضافی مارک‌داون پیست شده"
                  >
                    <Sparkles className="w-3 h-3" />
                    پاکسازی
                  </button>
                )}
              </div>
            </div>

            {/* Note Content Textarea styled with current background & text color */}
            <div className="flex-1 flex flex-col min-h-[220px]">
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="یادداشت خود را اینجا بنویسید..."
                className="w-full flex-1 p-4 rounded-2xl resize-none focus:outline-none border border-black/10 transition-all text-sm leading-relaxed"
                style={{
                  backgroundColor: color,
                  color: textColor,
                  fontWeight: isBold ? 700 : 400,
                }}
              />
            </div>

            {/* Delete button */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onDelete(note.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف این استیکی‌نوت</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-400">
            <FileText className="w-12 h-12 stroke-1 mb-2 opacity-50" />
            <p className="text-xs">هیچ استیکی‌نوتی انتخاب نشده است.</p>
          </div>
        )
      ) : (
        /* List of all sticky notes in document */
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {allNotes.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-xs">
              هنوز هیچ استیکی‌نوتی به این کتاب یا سند اضافه نشده است.
            </div>
          ) : (
            allNotes.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (onSelectNote) onSelectNote(n);
                  setViewTab('edit');
                }}
                className="p-3 rounded-2xl border border-neutral-200/80 hover:border-neutral-400 hover:shadow-xs transition-all cursor-pointer bg-white"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-neutral-900 truncate">
                    {n.title || `صفحه ${n.pageNumber}`}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    ص {n.pageNumber}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                  {n.content || '(یادداشت خالی)'}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
