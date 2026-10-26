import { StudyFile, NoteItem, FileEdits, StudyTask } from '../types';

const DB_NAME = 'StudyDeskDB';
const DB_VERSION = 2;
const STORE_FILES = 'study_files';
const STORE_EDITS = 'file_edits';
const STORE_NOTES = 'study_notes';

const TASKS_STORAGE_KEY = 'study_tasks_list';
const FILE_HANDLES_CACHE = new Map<string, any>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const req = window.indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_EDITS)) {
        db.createObjectStore(STORE_EDITS, { keyPath: 'fileId' });
      }
      if (!db.objectStoreNames.contains(STORE_NOTES)) {
        db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ----------------------------------------------------
// File Handles In-Memory Cache
// ----------------------------------------------------
export function registerFileHandle(id: string, handle: any): void {
  if (id && handle) {
    FILE_HANDLES_CACHE.set(id, handle);
  }
}

export function getFileHandle(id: string): any {
  return FILE_HANDLES_CACHE.get(id);
}

// ----------------------------------------------------
// Study Files Storage (IndexedDB)
// ----------------------------------------------------
export async function getAllStudyFiles(): Promise<StudyFile[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readonly');
      const store = tx.objectStore(STORE_FILES);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as StudyFile[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Fallback to memory for files:', e);
    return [];
  }
}

export async function saveStudyFileToStorage(file: StudyFile): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readwrite');
      const store = tx.objectStore(STORE_FILES);
      const fileToSave = {
        ...file,
        lastModified: new Date().toISOString(),
      };
      const req = store.put(fileToSave);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Failed to save study file:', e);
  }
}

export async function deleteStudyFileFromStorage(id: string, fileName?: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FILES, STORE_EDITS], 'readwrite');
      tx.objectStore(STORE_FILES).delete(id);
      tx.objectStore(STORE_EDITS).delete(id);
      tx.oncomplete = () => {
        FILE_HANDLES_CACHE.delete(id);
        if (fileName) {
          FILE_HANDLES_CACHE.delete(fileName);
        }
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('Failed to delete study file:', e);
  }
}

// ----------------------------------------------------
// File Edits (Strokes & Sticky Notes) Storage
// ----------------------------------------------------
export async function getFileEditsFromStorage(fileId: string): Promise<FileEdits | null> {
  if (!fileId) return null;
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_EDITS, 'readonly');
      const store = tx.objectStore(STORE_EDITS);
      const req = store.get(fileId);
      req.onsuccess = () => resolve((req.result as FileEdits) || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveFileEditsToStorage(fileId: string, edits: FileEdits): Promise<void> {
  if (!fileId) return;
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_EDITS, 'readwrite');
      const store = tx.objectStore(STORE_EDITS);
      const req = store.put({
        ...edits,
        fileId,
        updatedAt: new Date().toISOString(),
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Failed to save file edits:', e);
  }
}

// ----------------------------------------------------
// Notes Storage
// ----------------------------------------------------
export async function getAllNotesFromStorage(): Promise<NoteItem[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NOTES, 'readonly');
      const store = tx.objectStore(STORE_NOTES);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as NoteItem[]) || []);
      req.onerror = () => {
        const local = localStorage.getItem('study_workspace_notes');
        resolve(local ? JSON.parse(local) : []);
      };
    });
  } catch {
    try {
      const local = localStorage.getItem('study_workspace_notes');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  }
}

export async function saveAllNotesToStorage(notes: NoteItem[]): Promise<void> {
  try {
    localStorage.setItem('study_workspace_notes', JSON.stringify(notes));
    const db = await openDatabase();
    const tx = db.transaction(STORE_NOTES, 'readwrite');
    const store = tx.objectStore(STORE_NOTES);
    store.clear();
    notes.forEach((note) => store.put(note));
  } catch (e) {
    console.warn('Saved notes to localStorage fallback:', e);
  }
}

// ----------------------------------------------------
// Tasks Storage (Synchronous API for NotesOverview)
// ----------------------------------------------------
export function getAllTasksFromStorage(): StudyTask[] {
  try {
    const saved = localStorage.getItem(TASKS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading tasks:', e);
  }
  return [];
}

export function saveAllTasksToStorage(tasks: StudyTask[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks:', e);
  }
}
