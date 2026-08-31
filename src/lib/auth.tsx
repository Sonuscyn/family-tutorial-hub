import { createContext, useContext, useState, type ReactNode } from "react";

export interface FamilyUser {
  id: string;
  name: string;
  avatar: string;         // data URL or empty
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

function loadUsers(): FamilyUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* noop */ }
  try { localStorage.setItem(USERS_KEY, JSON.stringify([])); } catch { /* noop */ }
  return [];
}

function saveUsers(users: FamilyUser[]) {
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<FamilyUser[]>(loadUsers);
  const [user, setUser] = useState<FamilyUser | null>(() => {
    const id = loadCurrentId();
    const all = loadUsers();
    return all.find(u => u.id === id) ?? null;
  });

  const register: AuthContextValue["register"] = (name, password, avatarColor) => {
    if (!name.trim()) return { ok: false, error: "请输入名字" };
    if (password.length < 3) return { ok: false, error: "密码至少 3 位" };

    const all = loadUsers();
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
    saveUsers(next);
    setUsers(next);
    saveCurrentId(newUser.id);
    setUser(newUser);
    return { ok: true };
  };

  const login: AuthContextValue["login"] = (userId, password) => {
    const all = loadUsers();
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
    const all = loadUsers();
    const next = all.map(u => u.id === updated.id ? updated : u);
    saveUsers(next);
    setUsers(next);
    setUser(updated);
  };

  const deleteMember: AuthContextValue["deleteMember"] = (id) => {
    const all = loadUsers();
    const next = all.filter(u => u.id !== id);
    saveUsers(next);
    setUsers(next);
    if (user?.id === id) { saveCurrentId(null); setUser(null); }
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
