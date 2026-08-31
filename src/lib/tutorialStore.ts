import type { Tutorial, Step } from "../types";

const KEY = "fth_user_tutorials";

export interface UserTutorial extends Tutorial {
  isUserCreated: true;
  userId: string;
}

export function loadUserTutorials(): UserTutorial[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return [];
}

function saveUserTutorials(list: UserTutorial[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* quota */ }
}

export function getUserTutorial(id: string): UserTutorial | undefined {
  return loadUserTutorials().find(t => t.id === id);
}

export function addUserTutorial(t: UserTutorial) {
  const list = loadUserTutorials();
  const idx = list.findIndex(x => x.id === t.id);
  if (idx >= 0) list[idx] = t;
  else list.unshift(t);
  saveUserTutorials(list);
}

export function deleteUserTutorial(id: string) {
  saveUserTutorials(loadUserTutorials().filter(t => t.id !== id));
}

export function buildStepsFromDraft(draftSteps: { id: string; title: string; text: string; img: string | null; video: string | null }[]): Step[] {
  return draftSteps.map(ds => ({
    id: ds.id,
    title: ds.title || "未命名步骤",
    imagePrompt: ds.img || "",
    text: ds.text,
    video: ds.video || undefined,
  }));
}
