const AK_KEY = "fth_qn_ak";
const SK_KEY = "fth_qn_sk";
const BUCKET_KEY = "fth_qn_bucket";
const DOMAIN_KEY = "fth_qn_domain";
const OBJ_KEY = "app-data.json";
const LAST_PULL = "fth_qn_last_pull";
const POLL_INTERVAL = 30000; // 30s
const PUSH_DEBOUNCE = 5000; // 5s

let pollTimer: ReturnType<typeof setInterval> | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let onSyncCallback: (() => void) | null = null;

export function getAK(): string { try { return localStorage.getItem(AK_KEY) ?? ""; } catch { return ""; } }
export function getSK(): string { try { return localStorage.getItem(SK_KEY) ?? ""; } catch { return ""; } }
export function getBucket(): string { try { return localStorage.getItem(BUCKET_KEY) ?? ""; } catch { return ""; } }
export function getDomain(): string { try { return localStorage.getItem(DOMAIN_KEY) ?? ""; } catch { return ""; } }

export function setQiniuConfig(ak: string, sk: string, bucket: string, domain: string) {
  try {
    localStorage.setItem(AK_KEY, ak);
    localStorage.setItem(SK_KEY, sk);
    localStorage.setItem(BUCKET_KEY, bucket);
    localStorage.setItem(DOMAIN_KEY, domain);
  } catch { /* noop */ }
}

export function clearQiniuConfig() {
  try {
    localStorage.removeItem(AK_KEY);
    localStorage.removeItem(SK_KEY);
    localStorage.removeItem(BUCKET_KEY);
    localStorage.removeItem(DOMAIN_KEY);
    localStorage.removeItem(LAST_PULL);
  } catch { /* noop */ }
}

export function isQiniuReady(): boolean {
  return getAK().length > 0 && getSK().length > 0 && getBucket().length > 0 && getDomain().length > 0;
}

export function setSyncCallback(cb: () => void) {
  onSyncCallback = cb;
}

// base64url encode
function b64url(data: Uint8Array | ArrayBuffer): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function strToBytes(s: string): ArrayBuffer {
  const buf = new ArrayBuffer(s.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) arr[i] = s.charCodeAt(i);
  return buf;
}

// generate Qiniu upload token using HMAC-SHA1
async function genToken(): Promise<string> {
  const ak = getAK();
  const sk = getSK();
  const bucket = getBucket();
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  const policy = JSON.stringify({ scope: `${bucket}:${OBJ_KEY}`, deadline });
  const encodedPolicy = b64url(strToBytes(policy));

  const keyData = strToBytes(sk);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", cryptoKey, strToBytes(encodedPolicy));
  const encodedSign = b64url(new Uint8Array(sigBuf));

  return `${ak}:${encodedSign}:${encodedPolicy}`;
}

function collectAllData(): Record<string, string> {
  const data: Record<string, string> = {};
  const excluded = new Set([AK_KEY, SK_KEY, BUCKET_KEY, DOMAIN_KEY, LAST_PULL, "fth_gh_token", "fth_supabase_url", "fth_supabase_anon", "fth_lean_id", "fth_lean_key", "fth_lean_server", "fth_lean_obj_id", "fth_lean_last_pull"]);
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

export async function pushToQiniu(): Promise<boolean> {
  if (!isQiniuReady()) return false;
  try {
    const token = await genToken();
    const data = collectAllData();
    data["fth_last_sync_time"] = new Date().toISOString();
    const content = JSON.stringify(data);

    const formData = new FormData();
    formData.append("token", token);
    formData.append("key", OBJ_KEY);
    formData.append("file", new Blob([content], { type: "application/json" }), OBJ_KEY);

    const res = await fetch("https://upload.qiniup.com/", {
      method: "POST",
      body: formData,
    });
    return res.ok;
  } catch { return false; }
}

export async function pullFromQiniu(): Promise<{ hasChanges: boolean; data?: Record<string, string> }> {
  if (!isQiniuReady()) return { hasChanges: false };
  try {
    const domain = getDomain().replace(/\/$/, "");
    const res = await fetch(`${domain}/${OBJ_KEY}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return { hasChanges: false };

    const remoteData = await res.json() as Record<string, string>;
    const remoteTime = remoteData["fth_last_sync_time"] ?? "";
    const localTime = localStorage.getItem(LAST_PULL) ?? "";

    if (remoteTime && localTime && remoteTime <= localTime) {
      return { hasChanges: false };
    }

    localStorage.setItem(LAST_PULL, remoteTime || new Date().toISOString());
    return { hasChanges: true, data: remoteData };
  } catch {
    return { hasChanges: false };
  }
}

export function startQiniuSync() {
  if (!isQiniuReady()) return;
  stopQiniuSync();

  pullFromQiniu().then(({ hasChanges, data }) => {
    if (hasChanges && data) {
      restoreData(data);
      onSyncCallback?.();
      window.dispatchEvent(new Event("fth-data-synced"));
    }
  });

  pollTimer = setInterval(async () => {
    const { hasChanges, data } = await pullFromQiniu();
    if (hasChanges && data) {
      restoreData(data);
      onSyncCallback?.();
      window.dispatchEvent(new Event("fth-data-synced"));
    }
  }, POLL_INTERVAL);
}

export function scheduleQiniuBackup() {
  if (!isQiniuReady()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { pushToQiniu(); }, PUSH_DEBOUNCE);
}

export function stopQiniuSync() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
}
