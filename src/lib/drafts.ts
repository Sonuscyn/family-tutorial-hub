export interface DraftStep {
  id: string;
  title: string;
  text: string;
  img: string | null;
  video: string | null;
}

export interface TutorialDraft {
  id: string;
  userId: string;
  cover: string | null;
  coverVideo: string | null;
  title: string;
  category: string;
  tags: string;
  steps: DraftStep[];
  updatedAt: string;
}

const KEY = "fth_drafts";

export function loadDrafts(userId: string): TutorialDraft[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const all: TutorialDraft[] = JSON.parse(raw);
    return all.filter(d => d.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch { return []; }
}

export function loadAllDrafts(): TutorialDraft[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

export function saveDraft(draft: TutorialDraft) {
  try {
    const all = loadAllDrafts();
    const idx = all.findIndex(d => d.id === draft.id);
    if (idx >= 0) all[idx] = draft;
    else all.push(draft);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* quota */ }
}

export function deleteDraft(id: string) {
  try {
    const all = loadAllDrafts().filter(d => d.id !== id);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* noop */ }
}
