import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getSupabase, isSupabaseReady } from "./supabase";
import { scheduleGiteeBackup as scheduleBackup } from "./giteeSync";

export interface FamilyUser {
  id: string;
  name: string;
  avatar: string;
  avatarColor: string;
  password: string;
  bio: string;
  joinDate: string;
}

interface AuthContextValue {
  user: FamilyUser | null;
  users: FamilyUser[];
  register: (name: string, password: string, avatarColor: string) => { ok: boolean; error?: string };
  login: (userId: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (partial: Partial<FamilyUser>) => void;
  deleteMember: (id: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS_KEY = "fth_users";
const CURRENT_KEY = "fth_current_user";

const avatarColors = [
  "#E08A2A", "#A8B89A", "#B89968", "#D4B896",
  "#C45A7A", "#4A7BB5", "#8A6CB5", "#4A9D7E",
];

function loadLocal(): FamilyUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return [];
}

function saveLocal(users: FamilyUser[]) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch { /* quota */ }
}

function loadCurrentId(): string | null {
  try { return localStorage.getItem(CURRENT_KEY); } catch { return null; }
}

function saveCurrentId(id: string | null) {
  try {
    if (id) localStorage.setItem(CURRENT_KEY, id);
    else localStorage.removeItem(CURRENT_KEY);
  } catch { /* noop */ }
}

function mapRow(row: any): FamilyUser {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar ?? "",
    avatarColor: row.avatar_color ?? "#E08A2A",
    password: row.password ?? "0000",
    bio: row.bio ?? "",
    joinDate: row.join_date ?? "",
  };
}

function toRow(u: FamilyUser) {
  return {
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    avatar_color: u.avatarColor,
    password: u.password,
    bio: u.bio,
    join_date: u.joinDate,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const sb = getSupabase();
  const [users, setUsers] = useState<FamilyUser[]>(loadLocal);
  const [user, setUser] = useState<FamilyUser | null>(() => {
    const id = loadCurrentId();
    const all = loadLocal();
    return all.find(u => u.id === id) ?? null;
  });

  // load from Supabase + subscribe (gracefully degrade if unreachable)
  useEffect(() => {
    if (!sb || !isSupabaseReady()) return;
    let mounted = true;

    (async () => {
      try {
        const { data } = await sb.from("members").select("*");
        if (!mounted || !data) return;
        const mapped: FamilyUser[] = data.map(mapRow);
        setUsers(mapped);
        saveLocal(mapped);
        const cid = loadCurrentId();
        if (cid) {
          const found = mapped.find(u => u.id === cid);
          if (found) setUser(found);
        }
      } catch { /* Supabase unreachable, use localStorage */ }
    })();

    const channel = sb
      .channel("members_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, (payload: any) => {
        setUsers((prev: FamilyUser[]) => {
          if (payload.eventType === "INSERT") {
            const newRow = mapRow(payload.new);
            if (prev.some(u => u.id === newRow.id)) return prev;
            return [...prev, newRow];
          }
          if (payload.eventType === "UPDATE") {
            const updated = mapRow(payload.new);
            return prev.map(u => u.id === updated.id ? updated : u);
          }
          if (payload.eventType === "DELETE") {
            return prev.filter(u => u.id !== payload.old.id);
          }
          return prev;
        });
      })
      .subscribe();

    return () => { mounted = false; sb.removeChannel(channel); };
  }, [sb]);

  // listen for GitHub auto-sync events
  useEffect(() => {
    const onSync = () => {
      const fresh = loadLocal();
      setUsers(fresh);
      const cid = loadCurrentId();
      if (cid) {
        const found = fresh.find(u => u.id === cid);
        if (found) setUser(found);
      }
    };
    window.addEventListener("fth-data-synced", onSync);
    return () => window.removeEventListener("fth-data-synced", onSync);
  }, []);

  const register: AuthContextValue["register"] = (name, password, avatarColor) => {
    if (!name.trim()) return { ok: false, error: "请输入名字" };
    if (password.length < 3) return { ok: false, error: "密码至少 3 位" };

    const all = loadLocal();
    if (all.some(u => u.name === name.trim())) return { ok: false, error: "这个名字已存在" };

    const newUser: FamilyUser = {
      id: `m-${Date.now()}`,
      name: name.trim(),
      avatar: "",
      avatarColor: avatarColor || avatarColors[all.length % avatarColors.length],
      password,
      bio: "",
      joinDate: new Date().toISOString().slice(0, 10),
    };

    const next = [...all, newUser];
    saveLocal(next);
    setUsers(next);
    saveCurrentId(newUser.id);
    setUser(newUser);
    scheduleBackup();

    if (sb) {
      sb.from("members").insert(toRow(newUser)).then(() => {});
    }
    return { ok: true };
  };

  const login: AuthContextValue["login"] = (userId, password) => {
    const all = loadLocal();
    const found = all.find(u => u.id === userId);
    if (!found) return { ok: false, error: "找不到这个成员" };
    if (found.password !== password) return { ok: false, error: "密码不对哦" };
    saveCurrentId(found.id);
    setUser(found);
    return { ok: true };
  };

  const logout = () => {
    saveCurrentId(null);
    setUser(null);
  };

  const updateProfile: AuthContextValue["updateProfile"] = (partial) => {
    if (!user) return;
    const updated = { ...user, ...partial };
    const all = loadLocal();
    const next = all.map(u => u.id === updated.id ? updated : u);
    saveLocal(next);
    setUsers(next);
    setUser(updated);
    scheduleBackup();

    if (sb) {
      sb.from("members").update(toRow(updated)).eq("id", updated.id).then(() => {});
    }
  };

  const deleteMember: AuthContextValue["deleteMember"] = (id) => {
    const all = loadLocal();
    const next = all.filter(u => u.id !== id);
    saveLocal(next);
    setUsers(next);
    if (user?.id === id) { saveCurrentId(null); setUser(null); }
    scheduleBackup();

    if (sb) {
      sb.from("members").delete().eq("id", id).then(() => {});
    }
  };

  return (
    <AuthContext.Provider value={{ user, users, register, login, logout, updateProfile, deleteMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { avatarColors };
