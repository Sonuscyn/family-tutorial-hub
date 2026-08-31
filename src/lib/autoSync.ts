import { getToken, hasToken } from "./githubSync";

const REPO_OWNER = "Sonuscyn";
const REPO_NAME = "family-tutorial-hub";
const SYNC_FILE = "app-data.json";
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${SYNC_FILE}`;
const SYNC_FLAG = "fth_autosync";
const GITHUB_BACKUP_FLAG = "fth_gh_backup";
const LAST_SYNC_TIME = "fth_last_sync_time";
const SYNC_INTERVAL = 120000; // 2 minutes polling
const PUSH_DEBOUNCE = 5000; // 5 second debounce
const GITHUB_BACKUP_INTERVAL = 300000; // 5 minutes

let backupTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let githubBackupTimer: ReturnType<typeof setInterval> | null = null;
let lastContentHash = "";

export function isGithubBackupEnabled(): boolean {
  try { return localStorage.getItem(GITHUB_BACKUP_FLAG) === "1"; } catch { return false; }
}

export function setGithubBackupEnabled(enabled: boolean) {
  try { localStorage.setItem(GITHUB_BACKUP_FLAG, enabled ? "1" : "0"); } catch { /* noop */ }
}

export function startGithubBackup() {
  if (!hasToken() || !isGithubBackupEnabled()) return;
  stopGithubBackup();
  githubBackupTimer = setInterval(() => { pushToGitHub(); }, GITHUB_BACKUP_INTERVAL);
}

export function stopGithubBackup() {
  if (githubBackupTimer) { clearInterval(githubBackupTimer); githubBackupTimer = null; }
}

export function isAutoSyncEnabled(): boolean {
  try {
    const v = localStorage.getItem(SYNC_FLAG);
    if (v === "0") return false;
    return true;
  } catch { return true; }
}

export function setAutoSyncEnabled(enabled: boolean) {
  try { localStorage.setItem(SYNC_FLAG, enabled ? "1" : "0"); } catch { /* noop */ }
}

function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(b64: string): string {
  return decodeURIComponent(escape(atob(b64)));
}

function collectAllData(): Record<string, string> {
  const data: Record<string, string> = {};
  const excluded = new Set(["fth_gh_token", SYNC_FLAG, "fth_lean_id", "fth_lean_key", "fth_lean_server", "fth_lean_obj_id", "fth_lean_last_pull", "fth_supabase_url", "fth_supabase_anon"]);
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith("fth_") && !excluded.has(key)) {
        data[key] = localStorage.getItem(key) ?? "";
      } else if (key === "siteSettings") {
        data[key] = localStorage.getItem(key) ?? "";
      }
    }
  } catch { /* noop */ }
  return data;
}

function restoreData(data: Record<string, string>) {
  try {
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, value);
    }
  } catch { /* quota */ }
}

export async function pushToGitHub(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  const data = collectAllData();
  data[LAST_SYNC_TIME] = new Date().toISOString();
  const content = toBase64(JSON.stringify(data));

  let sha: string | undefined;
  try {
    const res = await fetch(`${API_BASE}?ref=master`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    if (res.ok) {
      const json = await res.json();
      sha = json.sha;
      lastContentHash = sha ?? "";
    }
  } catch { /* file may not exist */ }

  try {
    const res = await fetch(API_BASE, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `sync: ${new Date().toISOString().slice(0, 19)}`,
        content,
        ...(sha ? { sha } : {}),
      }),
    });
    if (res.ok) {
      const json = await res.json();
      lastContentHash = json.content?.sha ?? "";
      return true;
    }
  } catch { /* network error */ }
  return false;
}

export async function pullFromGitHub(): Promise<{ hasChanges: boolean; data?: Record<string, string> }> {
  const token = getToken();
  if (!token) return { hasChanges: false };

  try {
    const res = await fetch(`${API_BASE}?ref=master`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });

    if (!res.ok) return { hasChanges: false };

    const json = await res.json();
    const sha = json.sha ?? "";
    if (sha && sha === lastContentHash) return { hasChanges: false };
    lastContentHash = sha;

    const content = fromBase64((json.content ?? "").replace(/\n/g, ""));
    const data = JSON.parse(content) as Record<string, string>;

    const remoteTime = data[LAST_SYNC_TIME] ?? "";
    const localTime = localStorage.getItem(LAST_SYNC_TIME) ?? "";

    if (remoteTime && localTime && remoteTime <= localTime) {
      return { hasChanges: false };
    }

    return { hasChanges: true, data };
  } catch {
    return { hasChanges: false };
  }
}

let onSyncCallback: (() => void) | null = null;

export function setSyncCallback(cb: () => void) {
  onSyncCallback = cb;
}

export function startAutoSync() {
  if (!hasToken() || !isAutoSyncEnabled()) return;
  stopAutoSync();

  pullFromGitHub().then(({ hasChanges, data }) => {
    if (hasChanges && data) {
      restoreData(data);
      onSyncCallback?.();
      window.dispatchEvent(new Event("fth-data-synced"));
    }
  });

  pollTimer = setInterval(async () => {
    if (!hasToken() || !isAutoSyncEnabled()) return;
    const { hasChanges, data } = await pullFromGitHub();
    if (hasChanges && data) {
      restoreData(data);
      onSyncCallback?.();
      window.dispatchEvent(new Event("fth-data-synced"));
    }
  }, SYNC_INTERVAL);
}

export function scheduleBackup() {
  if (!hasToken() || !isAutoSyncEnabled()) return;
  if (backupTimer) clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    pushToGitHub();
  }, PUSH_DEBOUNCE);
}

export function stopAutoSync() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (backupTimer) { clearTimeout(backupTimer); backupTimer = null; }
}

export function isSyncing(): boolean {
  return pollTimer !== null;
}
