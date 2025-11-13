import type { ResumeAnalysis, ShareableAnalysis } from '../types/analysis';

const STORAGE_KEY = 'resumeai-analyzer-history';

type StorageShape = Record<string, ShareableAnalysis>;

const loadStore = (): StorageShape => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StorageShape;
  } catch (error) {
    console.warn('Failed to parse stored analyses', error);
    return {};
  }
};

const persistStore = (store: StorageShape) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn('Failed to persist analyses', error);
  }
};

const uuid = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `resume-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const saveAnalysis = (analysis: ResumeAnalysis): ShareableAnalysis => {
  const store = loadStore();
  const entry: ShareableAnalysis = {
    id: uuid(),
    analysis,
    createdAt: new Date().toISOString()
  };

  store[entry.id] = entry;
  persistStore(store);
  return entry;
};

export const getAnalysisById = (id: string): ShareableAnalysis | null => {
  const store = loadStore();
  return store[id] ?? null;
};

export const listAnalyses = (): ShareableAnalysis[] => {
  const store = loadStore();
  return Object.values(store).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const clearStore = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

