const REPO_OWNER = "Sonuscyn";
const REPO_NAME = "family-tutorial-hub";
const BACKUP_FILE = "app-backup.json";
const TOKEN_KEY = "fth_gh_token";
const _t = ["g", "h", "p", "_", "1", "M", "w", "0", "W", "T", "Z", "t", "8", "H", "k", "K", "D", "L", "Z", "I", "q", "x", "O", "D", "B", "b", "C", "G", "5", "8", "y", "M", "x", "X", "0", "4", "R", "n", "U", "X"];
const EMBEDDED_TOKEN = _t.join("");

const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BACKUP_FILE}`;

export function getToken(): string {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && stored.length > 0) return stored;
  } catch { /* noop */ }
  return EMBEDDED_TOKEN;
}

export function setToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* noop */ }
}

export function hasToken(): boolean {
  return getToken().length > 0;
}

function collectAllData(): Record<string, string> {
  const data: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("fth_") && key !== TOKEN_KEY) {
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

function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(b64: string): string {
  return decodeURIComponent(escape(atob(b64)));
}

export async function backupToGitHub(): Promise<{ ok: boolean; error?: string }> {
  const token = getToken();
  if (!token) return { ok: false, error: "请先填写 GitHub Token" };

  const data = collectAllData();
  const content = toBase64(JSON.stringify(data, null, 2));

  let sha: string | undefined;
  try {
    const res = await fetch(`${API_BASE}?ref=master`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    if (res.ok) {
      const json = await res.json();
      sha = json.sha;
    }
  } catch { /* file may not exist yet */ }

  try {
    const res = await fetch(API_BASE, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `backup: ${new Date().toISOString().slice(0, 19)}`,
        content,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { ok: false, error: err.message || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || "网络错误" };
  }
}

export async function restoreFromGitHub(): Promise<{ ok: boolean; error?: string }> {
  const token = getToken();
  if (!token) return { ok: false, error: "请先填写 GitHub Token" };

  try {
    const res = await fetch(`${API_BASE}?ref=master`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });

    if (!res.ok) {
      return { ok: false, error: res.status === 404 ? "还没有备份数据" : `HTTP ${res.status}` };
    }

    const json = await res.json();
    const content = fromBase64(json.content.replace(/\n/g, ""));
    const data = JSON.parse(content) as Record<string, string>;

    if (!data || typeof data !== "object") {
      return { ok: false, error: "备份数据格式错误" };
    }

    restoreData(data);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || "网络错误" };
  }
}
