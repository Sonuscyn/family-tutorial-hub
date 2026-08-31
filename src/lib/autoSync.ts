import { getToken } from "./githubSync";

const REPO_OWNER = "Sonuscyn";
const REPO_NAME = "family-tutorial-hub";
const SYNC_FILE = "app-data.json";
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${SYNC_FILE}`;

function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(b64: string): string {
  return decodeURIComponent(escape(atob(b64)));
}

function collectAllData(): Record<string, string> {
  const data: Record<string, string> = {};
  const excluded = new Set(["fth_gh_token", "fth_lean_id", "fth_lean_key", "fth_lean_server", "fth_supabase_url", "fth_supabase_anon"]);
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
  data["fth_last_sync_time"] = new Date().toISOString();
  const content = toBase64(JSON.stringify(data));

  let sha: string | undefined;
  try {
    const res = await fetch(`${API_BASE}?ref=master`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    if (res.ok) {
      const json = await res.json();
      sha = json.sha;
    }
  } catch { /* file may not exist */ }

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
    return res.ok;
  } catch { return false; }
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
    const content = fromBase64((json.content ?? "").replace(/\n/g, ""));
    const data = JSON.parse(content) as Record<string, string>;
    return { hasChanges: true, data };
  } catch {
    return { hasChanges: false };
  }
}

export function restoreFromData(data: Record<string, string>) {
  restoreData(data);
  window.dispatchEvent(new Event("fth-data-synced"));
}
