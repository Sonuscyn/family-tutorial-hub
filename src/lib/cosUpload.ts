const SID_KEY = "fth_cos_sid";
const SKEY_KEY = "fth_cos_skey";
const BUCKET_KEY = "fth_cos_bucket";
const REGION_KEY = "fth_cos_region";

export function getSid(): string { try { return localStorage.getItem(SID_KEY) ?? ""; } catch { return ""; } }
export function getSkey(): string { try { return localStorage.getItem(SKEY_KEY) ?? ""; } catch { return ""; } }
export function getBucket(): string { try { return localStorage.getItem(BUCKET_KEY) ?? ""; } catch { return ""; } }
export function getRegion(): string { try { return localStorage.getItem(REGION_KEY) ?? ""; } catch { return ""; } }

export function setCosConfig(sid: string, skey: string, bucket: string, region: string) {
  try {
    localStorage.setItem(SID_KEY, sid);
    localStorage.setItem(SKEY_KEY, skey);
    localStorage.setItem(BUCKET_KEY, bucket);
    localStorage.setItem(REGION_KEY, region);
  } catch { /* noop */ }
}

export function clearCosConfig() {
  try {
    localStorage.removeItem(SID_KEY);
    localStorage.removeItem(SKEY_KEY);
    localStorage.removeItem(BUCKET_KEY);
    localStorage.removeItem(REGION_KEY);
  } catch { /* noop */ }
}

export function isCosReady(): boolean {
  return getSid().length > 0 && getSkey().length > 0 && getBucket().length > 0 && getRegion().length > 0;
}

export function getHost(): string {
  return `${getBucket()}.cos.${getRegion()}.myqcloud.com`;
}

export function getFileUrl(key: string): string {
  return `https://${getHost()}/${key}`;
}

function bufToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, "0");
  }
  return hex;
}

function strToBuf(s: string): ArrayBuffer {
  const buf = new ArrayBuffer(s.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) arr[i] = s.charCodeAt(i);
  return buf;
}

async function hmacSha1(key: string, data: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", strToBuf(key), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, strToBuf(data));
  return bufToHex(sig);
}

async function sha1Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-1", strToBuf(data));
  return bufToHex(hash);
}

async function generateAuth(
  method: string,
  uri: string,
  host: string,
): Promise<string> {
  const sid = getSid();
  const skey = getSkey();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 600;
  const keyTime = `${now};${exp}`;

  const signKey = await hmacSha1(skey, keyTime);
  const httpHeaders = `host:${host}\n`;
  const formatStr = `${method.toLowerCase()}\n${uri}\n\n${httpHeaders}\n`;
  const hashedFormat = await sha1Hex(formatStr);
  const stringToSign = `sha1\n${keyTime}\n${hashedFormat}\n`;
  const signature = await hmacSha1(signKey, stringToSign);

  return `q-sign-algorithm=sha1&q-ak=${sid}&q-sign-time=${keyTime}&q-key-time=${keyTime}&q-header-list=host&q-url-param-list=&signature=${signature}`;
}

export async function uploadFile(
  file: File | Blob,
  key: string,
  contentType: string,
): Promise<string | null> {
  if (!isCosReady()) return null;
  try {
    const host = getHost();
    const uri = `/${key}`;
    const auth = await generateAuth("put", uri, host);
    const url = `https://${host}${uri}`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: auth,
        "Content-Type": contentType,
        Host: host,
      },
      body: file,
    });

    if (res.ok) {
      return getFileUrl(key);
    }
    return null;
  } catch {
    return null;
  }
}

export async function uploadImage(file: File | Blob): Promise<string | null> {
  if (!isCosReady()) return null;
  const ext = (file as File).name?.split(".").pop()?.toLowerCase() || "jpg";
  const key = `images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const ct = file.type || "image/jpeg";
  return uploadFile(file, key, ct);
}

export async function uploadVideo(file: File | Blob): Promise<string | null> {
  if (!isCosReady()) return null;
  const ext = (file as File).name?.split(".").pop()?.toLowerCase() || "mp4";
  const key = `videos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const ct = file.type || "video/mp4";
  return uploadFile(file, key, ct);
}

export async function uploadImageFromBase64(dataUrl: string): Promise<string | null> {
  if (!isCosReady()) return null;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = dataUrl.slice(dataUrl.indexOf("/") + 1, dataUrl.indexOf(";")).split("+")[0] || "jpg";
    const key = `images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    return uploadFile(blob, key, blob.type || "image/jpeg");
  } catch {
    return null;
  }
}
