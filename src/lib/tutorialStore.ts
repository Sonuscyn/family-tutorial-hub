import type { Tutorial, Step } from "../types";
import { getSupabase, isSupabaseReady } from "./supabase";
import { scheduleGiteeBackup as scheduleBackup } from "./giteeSync";

const KEY = "fth_user_tutorials";

export interface UserTutorial extends Tutorial {
  isUserCreated: true;
  userId: string;
}

export function loadUserTutorialsLocal(): UserTutorial[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return [];
}

function saveUserTutorialsLocal(list: UserTutorial[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* quota */ }
}

function mapRow(row: any): UserTutorial {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    coverPrompt: row.cover_prompt ?? "",
    coverSize: row.cover_size ?? "landscape_16_9",
    tags: Array.isArray(row.tags) ? row.tags : [],
    author: row.author,
    authorRole: row.author_role ?? "家人",
    avatarColor: row.avatar_color ?? "",
    date: row.date ?? "",
    intro: row.intro ?? "",
    steps: Array.isArray(row.steps) ? row.steps : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    likes: row.likes ?? 0,
    isUserCreated: true,
    userId: row.user_id ?? "",
  };
}

function toRow(t: UserTutorial) {
  return {
    id: t.id,
    user_id: t.userId,
    title: t.title,
    category: t.category,
    cover_prompt: t.coverPrompt,
    cover_size: t.coverSize,
    tags: t.tags,
    author: t.author,
    author_role: t.authorRole,
    avatar_color: t.avatarColor,
    date: t.date,
    intro: t.intro,
    steps: t.steps,
    comments: t.comments,
    likes: t.likes ?? 0,
  };
}

export async function loadUserTutorialsAsync(): Promise<UserTutorial[]> {
  const sb = getSupabase();
  if (sb && isSupabaseReady()) {
    try {
      const { data }: any = await sb.from("user_tutorials").select("*");
      if (data) {
        const mapped = data.map(mapRow);
        saveUserTutorialsLocal(mapped);
        return mapped;
      }
    } catch { /* fallback to local */ }
  }
  return loadUserTutorialsLocal();
}

export function loadUserTutorials(): UserTutorial[] {
  return loadUserTutorialsLocal();
}

export async function syncUserTutorials(): Promise<void> {
  const sb = getSupabase();
  if (!sb || !isSupabaseReady()) return;
  try {
    const { data }: any = await sb.from("user_tutorials").select("*");
    if (data) saveUserTutorialsLocal(data.map(mapRow));
  } catch { /* noop */ }
}

export function getUserTutorial(id: string): UserTutorial | undefined {
  return loadUserTutorialsLocal().find(t => t.id === id);
}

export async function addUserTutorial(t: UserTutorial) {
  const list = loadUserTutorialsLocal();
  const idx = list.findIndex(x => x.id === t.id);
  if (idx >= 0) list[idx] = t;
  else list.unshift(t);
  saveUserTutorialsLocal(list);
  scheduleBackup();

  const sb = getSupabase();
  if (sb && isSupabaseReady()) {
    try { await sb.from("user_tutorials").upsert(toRow(t)); } catch { /* noop */ }
  }
}

export async function deleteUserTutorial(id: string) {
  saveUserTutorialsLocal(loadUserTutorialsLocal().filter(t => t.id !== id));
  scheduleBackup();

  const sb = getSupabase();
  if (sb && isSupabaseReady()) {
    try { await sb.from("user_tutorials").delete().eq("id", id); } catch { /* noop */ }
  }
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
