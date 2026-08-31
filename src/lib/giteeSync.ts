const TOKEN_KEY = "fth_gitee_token";
const OWNER_KEY = "fth_gitee_owner";
const REPO_KEY = "fth_gitee_repo";
const SYNC_FILE = "app-data.json";
const LAST_SYNC_TIME = "fth_last_sync_time";
const POLL_INTERVAL = 30000; // 30s
const PUSH_DEBOUNCE = 5000; // 5s

let pollTimer: ReturnType<typeof setInterval> | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastSha = "";
let onSyncCallback: (() => void) | null = null;

export function getToken(): string { try { return localStorage.getItem(TOKEN_KEY) ?? ""; } catch { return ""; } }
export function getOwner(): string { try { return localStorage.getItem(OWNER_KEY) ?? ""; } catch { return ""; } }
export function getRepo(): string { try { return localStorage.getItem(REPO_KEY) ?? ""; } catch { return ""; } }

export function setGiteeConfig(token: string, owner: string, repo: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(OWNER_KEY, owner);
    localStorage.setItem(REPO_KEY, repo);
  } catch { /* noop */ }
}

export function clearGiteeConfig() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(OWNER_KEY);
    localStorage.removeItem(REPO_KEY);
    localStorage.removeItem(LAST_SYNC_TIME);
  } catch { /* noop */ }
}

export function isGiteeReady(): boolean {
  return getToken().length > 0 && getOwner().length > 0 && getRepo().length > 0;
}

export function setSyncCallback(cb: () => void) { onSyncCallback = cb; }

const API_BASE = () => `https://gitee.com/api/v5/repos/${getOwner()}/${getRepo()}/contents/${SYNC_FILE}`;

function toBase64(str: string): string { return btoa(unescape(encodeURIComponent(str))); }
function fromBase64(b64: string): string { return decodeURIComponent(escape(atob(b64))); }

function collectAllData(): Record<string, string> {
  const data: Record<string, string> = {};
  const excluded = new Set([TOKEN_KEY, OWNER_KEY, REPO_KEY, LAST_SYNC_TIME, "fth_gh_token", "fth_qn_ak", "fth_qn_sk", "fth_qn_bucket", "fth_qn_domain", "fth_qn_last_pull", "fth_supabase_url", "fth_supabase_anon", "fth_lean_id", "fth_lean_key", "fth_lean_server", "fth_lean_obj_id", "fth_lean_last_pull"]);
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
  try { for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v); } catch { /* quota */ }
}

export async function pushToGitee(): Promise<boolean> {
  if (!isGiteeReady()) return false;
  const token = getToken();
  const data = collectAllData();
  data[LAST_SYNC_TIME] = new Date().toISOString();
  const content = toBase64(JSON.stringify(data));

  let sha: string | undefined;
  try {
    const res = await fetch(`${API_BASE()}?access_token=${token}`);
    if (res.ok) { const j = await res.json(); sha = j.sha; lastSha = sha ?? ""; }
  } catch { /* file may not exist */ }

  try {
    const res = await fetch(`${API_BASE()}?access_token=${token}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: token,
        message: `sync: ${new Date().toISOString().slice(0, 19)}`,
        content,
        ...(sha ? { sha } : {}),
      }),
    });
    if (res.ok) { const j = await res.json(); lastSha = j.content?.sha ?? ""; return true; }
  } catch { /* network error */ }
  return false;
}

export async function pullFromGitee(): Promise<{ hasChanges: boolean; data?: Record<string, string> }> {
  if (!isGiteeReady()) return { hasChanges: false };
  try {
    const res = await fetch(`${API_BASE()}?access_token=${getToken()}`, { cache: "no-store" });
    if (!res.ok) return { hasChanges: false };
    const json = await res.json();
    const sha = json.sha ?? "";
    if (sha && sha === lastSha) return { hasChanges: false };
    lastSha = sha;
    const content = fromBase64((json.content ?? "").replace(/\n/g, ""));
    const data = JSON.parse(content) as Record<string, string>;
    const remoteTime = data[LAST_SYNC_TIME] ?? "";
    const localTime = localStorage.getItem(LAST_SYNC_TIME) ?? "";
    if (remoteTime && localTime && remoteTime <= localTime) return { hasChanges: false };
    return { hasChanges: true, data };
  } catch { return { hasChanges: false }; }
}

export function startGiteeSync() {
  if (!isGiteeReady()) return;
  stopGiteeSync();
  pullFromGitee().then(({ hasChanges, data }) => {
    if (hasChanges && data) { restoreData(data); onSyncCallback?.(); window.dispatchEvent(new Event("fth-data-synced")); }
  });
  pollTimer = setInterval(async () => {
    const { hasChanges, data } = await pullFromGitee();
    if (hasChanges && data) { restoreData(data); onSyncCallback?.(); window.dispatchEvent(new Event("fth-data-synced")); }
  }, POLL_INTERVAL);
}

export function scheduleGiteeBackup() {
  if (!isGiteeReady()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { pushToGitee(); }, PUSH_DEBOUNCE);
}

export function stopGiteeSync() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
}
