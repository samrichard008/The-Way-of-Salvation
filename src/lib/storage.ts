import type {
  ExportHistoryEntry,
  PresentationProject,
  StudioSettings,
} from '../types/presentation';
import { createInitialSeedProjects } from '../data/salvationContent';

const DB_NAME = 'WayOfSalvationStudioDB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_EXPORTS = 'exports';
const STORE_SETTINGS = 'settings';

const LS_PROJECTS_KEY = 'wos_studio_projects_v1';
const LS_EXPORTS_KEY = 'wos_studio_exports_v1';
const LS_SETTINGS_KEY = 'wos_studio_settings_v1';

export const DEFAULT_SETTINGS: StudioSettings = {
  defaultLanguage: 'en',
  defaultThemeId: 'christian-cinematic',
  defaultFormat: '16:9',
  defaultFonts: {
    ta: 'Noto Sans Tamil',
    en: 'Cinzel',
    si: 'Noto Sans Sinhala',
  },
  aiStylePreset: 'Christian Cinematic 4K',
  enforceHighContrastScrim: true,
  pptxMode: 'editable',
  pngScale: 1,
  includeChurchFooter: true,
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_EXPORTS)) {
        db.createObjectStore(STORE_EXPORTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut<T>(storeName: string, value: T): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(storeName: string, key: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbClear(storeName: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function loadProjects(): Promise<PresentationProject[]> {
  try {
    const items = await idbGetAll<PresentationProject>(STORE_PROJECTS);
    if (items.length > 0) {
      return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    const seeded = createInitialSeedProjects();
    for (const proj of seeded) {
      await idbPut(STORE_PROJECTS, proj);
    }
    return seeded;
  } catch {
    try {
      const raw = window.localStorage.getItem(LS_PROJECTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PresentationProject[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore localStorage failure
    }
    const seeded = createInitialSeedProjects();
    try {
      window.localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(seeded));
    } catch {
      // ignore quota failure
    }
    return seeded;
  }
}

export async function saveProject(project: PresentationProject): Promise<void> {
  const updated: PresentationProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  try {
    await idbPut(STORE_PROJECTS, updated);
  } catch {
    try {
      const existing = await loadProjects();
      const next = [updated, ...existing.filter((p) => p.id !== updated.id)];
      window.localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
}

export async function deleteProjectById(projectId: string): Promise<void> {
  try {
    await idbDelete(STORE_PROJECTS, projectId);
  } catch {
    try {
      const existing = await loadProjects();
      const next = existing.filter((p) => p.id !== projectId);
      window.localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
}

export async function loadExportHistory(): Promise<ExportHistoryEntry[]> {
  try {
    const items = await idbGetAll<ExportHistoryEntry>(STORE_EXPORTS);
    return items.sort((a, b) => b.exportedAt.localeCompare(a.exportedAt));
  } catch {
    try {
      const raw = window.localStorage.getItem(LS_EXPORTS_KEY);
      if (raw) return JSON.parse(raw) as ExportHistoryEntry[];
    } catch {
      // ignore
    }
    return [];
  }
}

export async function saveExportHistoryEntry(entry: ExportHistoryEntry): Promise<void> {
  try {
    await idbPut(STORE_EXPORTS, entry);
  } catch {
    try {
      const existing = await loadExportHistory();
      window.localStorage.setItem(LS_EXPORTS_KEY, JSON.stringify([entry, ...existing]));
    } catch {
      // ignore
    }
  }
}

export async function clearExportHistory(): Promise<void> {
  try {
    await idbClear(STORE_EXPORTS);
  } catch {
    try {
      window.localStorage.removeItem(LS_EXPORTS_KEY);
    } catch {
      // ignore
    }
  }
}

export async function loadStudioSettings(): Promise<StudioSettings> {
  try {
    const db = await openDatabase();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const req = tx.objectStore(STORE_SETTINGS).get('studio_settings');
      req.onsuccess = () => {
        const val = req.result as { key: string; value: StudioSettings } | undefined;
        resolve(val?.value ? { ...DEFAULT_SETTINGS, ...val.value } : DEFAULT_SETTINGS);
      };
      req.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  } catch {
    try {
      const raw = window.localStorage.getItem(LS_SETTINGS_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<StudioSettings>) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  }
}

export async function saveStudioSettings(settings: StudioSettings): Promise<void> {
  try {
    await idbPut(STORE_SETTINGS, { key: 'studio_settings', value: settings });
  } catch {
    try {
      window.localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }
}
