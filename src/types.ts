export type ActiveTab =
  | 'open-file'
  | 'library'
  | 'notes'
  | 'pomodoro'
  | 'analytics'
  | 'settings';

export type StudySessionType =
  | 'focus'
  | 'short-break'
  | 'long-break'
  | 'file-study'
  | 'app-usage';

export type PomodoroMode = 'focus' | 'short-break' | 'long-break';

export type PomodoroSound = 'crystal' | 'bell' | 'marimba' | 'soft' | 'zen';

export interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  roundsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundType: PomodoroSound;
  soundVolume: number;
  browserNotifications: boolean;
}

export interface PomodoroSession {
  id: string;
  type: StudySessionType;
  durationMinutes: number;
  completedAt?: string;
  createdAt?: string | number;
  timestamp?: string;
  date?: string;
  tag?: string;
  fileName?: string;
  source?: string;
}

export type EyeComfortMode =
  | 'normal'
  | 'yellow'
  | 'dark'
  | 'sepia'
  | 'grayscale'
  | 'dark-gray'
  | 'soft-gray';

export interface EyeComfortSettings {
  brightness: number;
  colorMode: EyeComfortMode;
  warmth: number;
}

export interface ToolShortcuts {
  hand: string;
  select: string;
  pen: string;
  highlighter: string;
  ruler: string;
  eraser: string;
  stickyNote: string;
  quickNotes: string;
}

export type CapsulePosition =
  | 'bottom-center'
  | 'top-center'
  | 'right-center'
  | 'left-center'
  | 'right-top'
  | 'top-right'
  | 'left-top'
  | 'top-left'
  | 'right-bottom'
  | 'bottom-right'
  | 'left-bottom'
  | 'bottom-left';

export function isCapsuleVertical(pos: CapsulePosition): boolean {
  return pos.includes('right') || pos.includes('left');
}

export interface PerformanceSettings {
  ecoMode: boolean;
  reducedMotion?: boolean;
  lowPowerRendering?: boolean;
  cachePages?: boolean;
}

export const DEFAULT_PERFORMANCE_SETTINGS: PerformanceSettings = {
  ecoMode: false,
  reducedMotion: false,
  lowPowerRendering: false,
  cachePages: true,
};

export interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface DrawingStroke {
  id: string;
  tool: 'pen' | 'highlighter' | 'ruler' | 'eraser';
  color: string;
  width: number;
  opacity?: number;
  points: DrawingPoint[];
}

export interface StickyNoteItem {
  id: string;
  fileId?: string;
  pageNumber: number;
  x: number;
  y: number;
  title?: string;
  content: string;
  color?: string;
  textColor?: string;
  isBold?: boolean;
  createdAt?: string | number;
  updatedAt?: string | number;
  selectedText?: string;
  tags?: string[];
  imageUrl?: string;
  images?: string[];
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  isPinned?: boolean;
  folderId?: string;
  tags?: string[];
  fileId?: string;
  pageNumber?: number;
  color?: string;
  attachedFileId?: string;
  attachedFileName?: string;
}

export interface NoteFolder {
  id: string;
  name: string;
  parentId?: string | null;
  color?: string;
  createdAt: string;
}

export interface StudyTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt?: string | number;
  completedAt?: string | number;
}

export interface FileCategory {
  id: string;
  name: string;
  color: string;
  createdAt?: string;
}

export interface StudyFile {
  id: string;
  name: string;
  size: number;
  data?: ArrayBuffer | Uint8Array;
  originalData?: ArrayBuffer | Uint8Array;
  fileHandle?: any;
  uploadDate?: string;
  lastOpened?: string;
  lastModified?: string;
  currentPage?: number;
  pageCount?: number;
  scale?: number;
  category?: string;
  categoryId?: string;
  isFavorite?: boolean;
  tags?: string[];
  pageStrokes?: Record<number, DrawingStroke[]>;
  stickyNotes?: StickyNoteItem[];
  thumbnail?: string;
}

export interface FileEdits {
  fileId: string;
  pageStrokes?: Record<number, DrawingStroke[]>;
  stickyNotes?: StickyNoteItem[];
  currentPage?: number;
  pageCount?: number;
  scale?: number;
  updatedAt?: string;
}
