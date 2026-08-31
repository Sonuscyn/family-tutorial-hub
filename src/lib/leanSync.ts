const LC_ID_KEY = "fth_lean_id";
const LC_KEY_KEY = "fth_lean_key";
const LC_SERVER_KEY = "fth_lean_server";
const LC_OBJ_ID_KEY = "fth_lean_obj_id";
const LC_LAST_PULL = "fth_lean_last_pull";
const POLL_INTERVAL = 30000; // 30 seconds
const PUSH_DEBOUNCE = 3000; // 3 seconds

let pollTimer: ReturnType<typeof setInterval> | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let onSyncCallback: (() => void) | null = null;

export function getLeanId(): string {
  try { return localStorage.getItem(LC_ID_KEY) ?? ""; } catch { return ""; }
}
export function getLeanKey(): string {
  try { return localStorage.getItem(LC_KEY_KEY) ?? ""; } catch { return ""; }
}
export function getLeanServer(): string {
  try { return localStorage.getItem(LC_SERVER_KEY) ?? ""; } catch { return ""; }
}
export function setLeanConfig(id: string, key: string, server: string) {
  try {
    localStorage.setItem(LC_ID_KEY, id);
    localStorage.setItem(LC_KEY_KEY, key);
    localStorage.setItem(LC_SERVER_KEY, server);
    localStorage.removeItem(LC_OBJ_ID_KEY);
  } catch { /* noop */ }
}
export function clearLeanConfig() {
  try {
    localStorage.removeItem(LC_ID_KEY);
    localStorage.removeItem(LC_KEY_KEY);
    localStorage.removeItem(LC_SERVER_KEY);
    localStorage.removeItem(LC_OBJ_ID_KEY);
  } catch { /* noop */ }
}
export function isLeanReady(): boolean {
  return getLeanId().length > 0 && getLeanKey().length > 0;
}

function apiBase(): string {
  const server = getLeanServer();
  if (server) return server.replace(/\/$/, "");
  return `https://${getLeanId().replace(/-/g, "")}.api.leancloud.cn`;
}

function headers(): Record<string, string> {
  return {
    "X-LC-Id": getLeanId(),
    "X-LC-Key": getLeanKey(),
    "Content-Type": "application/json",
  };
}

const CLASS_NAME = "AppData";

function collectAllData(): Record<string, string> {
  const data: Record<string, string> = {};
  const excluded = new Set([
    LC_ID_KEY, LC_KEY_KEY, LC_SERVER_KEY, LC_OBJ_ID_KEY, LC_LAST_PULL,
    "fth_gh_token", "fth_supabase_url", "fth_supabase_anon",
  ]);
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

export function setSyncCallback(cb: () => void) {
  onSyncCallback = cb;
}

async function getOrCreateObjectId(): Promise<string | null> {
  let objId = "";
  try { objId = localStorage.getItem(LC_OBJ_ID_KEY) ?? ""; } catch { /* noop */ }
  if (objId) return objId;

  // try to find existing object
  try {
    const res = await fetch(`${apiBase()}/1.1/classes/${CLASS_NAME}?limit=1`, {
      headers: headers(),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.results && json.results.length > 0) {
        objId = json.results[0].objectId;
        localStorage.setItem(LC_OBJ_ID_KEY, objId);
        return objId;
      }
    }
  } catch { /* noop */ }

  // create new object
  try {
    const res = await fetch(`${apiBase()}/1.1/classes/${CLASS_NAME}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ data: JSON.stringify(collectAllData()), updatedAt: new Date().toISOString() }),
    });
    if (res.ok) {
      const json = await res.json();
      objId = json.objectId;
      localStorage.setItem(LC_OBJ_ID_KEY, objId);
      return objId;
    }
  } catch { /* noop */ }
  return null;
}

export async function pushToLeanCloud(): Promise<boolean> {
  if (!isLeanReady()) return false;
  const objId = await getOrCreateObjectId();
  if (!objId) return false;

  const data = collectAllData();
  data["fth_last_sync_time"] = new Date().toISOString();

  try {
    const res = await fetch(`${apiBase()}/1.1/classes/${CLASS_NAME}/${objId}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ data: JSON.stringify(data), updatedAt: new Date().toISOString() }),
    });
    return res.ok;
  } catch { return false; }
}

export async function pullFromLeanCloud(): Promise<{ hasChanges: boolean; data?: Record<string, string> }> {
  if (!isLeanReady()) return { hasChanges: false };
  const objId = await getOrCreateObjectId();
  if (!objId) return { hasChanges: false };

  try {
    const res = await fetch(`${apiBase()}/1.1/classes/${CLASS_NAME}/${objId}`, {
      headers: headers(),
    });
    if (!res.ok) return { hasChanges: false };

    const json = await res.json();
    const raw = json.data;
    if (!raw) return { hasChanges: false };

    const remoteData = JSON.parse(raw) as Record<string, string>;

    // check if remote is newer
    const remoteTime = remoteData["fth_last_sync_time"] ?? "";
    const localTime = localStorage.getItem(LC_LAST_PULL) ?? "";

    if (remoteTime && localTime && remoteTime <= localTime) {
      return { hasChanges: false };
    }

    localStorage.setItem(LC_LAST_PULL, remoteTime || new Date().toISOString());
    return { hasChanges: true, data: remoteData };
  } catch {
    return { hasChanges: false };
  }
}

export function startLeanSync() {
  if (!isLeanReady()) return;
  stopLeanSync();

  // initial pull
  pullFromLeanCloud().then(({ hasChanges, data }) => {
    if (hasChanges && data) {
      restoreData(data);
      onSyncCallback?.();
      window.dispatchEvent(new Event("fth-data-synced"));
    }
  });

  // poll every 30 seconds
  pollTimer = setInterval(async () => {
    const { hasChanges, data } = await pullFromLeanCloud();
    if (hasChanges && data) {
      restoreData(data);
      onSyncCallback?.();
      window.dispatchEvent(new Event("fth-data-synced"));
    }
  }, POLL_INTERVAL);
}

export function scheduleLeanBackup() {
  if (!isLeanReady()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushToLeanCloud();
  }, PUSH_DEBOUNCE);
}

export function stopLeanSync() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
}
