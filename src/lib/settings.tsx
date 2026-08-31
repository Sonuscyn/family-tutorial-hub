import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { scheduleQiniuBackup as scheduleBackup } from "./qiniuSync";

export type CharacterType = "miffy" | "rilakkuma";
export type DecorationType = "none" | "crown" | "heart" | "apple";

export interface HomeCardDef {
  icon: string;
  title: string;
  desc: string;
  to: string;
}

export interface CustomCategory {
  name: string;
  emoji: string;
}

export interface SiteSettings {
  // Site identity
  siteName: string;
  userName: string;
  password: string;

  // Hero avatar (big, landing page only)
  heroCharType: CharacterType;
  heroStroke: string;
  heroFill: string;
  heroCheek: boolean;
  heroDecoration: DecorationType;
  heroDecorationColor: string;
  heroCustomUrl: string;

  // Logo mark (small, everywhere else)
  logoCharType: CharacterType;
  logoStroke: string;
  logoFill: string;
  logoCheek: boolean;
  logoDecoration: DecorationType;
  logoDecorationColor: string;
  logoCustomUrl: string;

  // Hero text
  heroBadge: string;
  heroTitle: string;
  heroDesc: string;
  heroButtonText: string;

  // Pet companion
  petName: string;
  petMessages: string[];

  // Homepage cards
  homeCards: HomeCardDef[];

  // Backgrounds
  bgImage: string;
  bgEnabled: boolean;
  browseBgImage: string;
  browseBgEnabled: boolean;

  // Custom categories
  customCategories: CustomCategory[];
}

const defaultSettings: SiteSettings = {
  siteName: "家庭教程站",
  userName: "家人",
  password: "0326",

  heroCharType: "miffy",
  heroStroke: "#C45A7A",
  heroFill: "#FFF5F8",
  heroCheek: true,
  heroDecoration: "crown",
  heroDecorationColor: "#F2C94C",
  heroCustomUrl: "",

  logoCharType: "miffy",
  logoStroke: "#8B5E6B",
  logoFill: "#FFFFFF",
  logoCheek: false,
  logoDecoration: "none",
  logoDecorationColor: "#F2C94C",
  logoCustomUrl: "",

  heroBadge: "欢迎",
  heroTitle: "把温暖的知识，\n一点点教给家人",
  heroDesc: "家里的学习小角落。跟着图文步骤慢慢来，看不懂就在步骤下面提问，看到就回。不着急，一点一点学。",
  heroButtonText: "进入教程",

  petName: "米菲陪你一起学",
  petMessages: [
    "来学点新东西吧～",
    "不会的随时提问哦！",
    "一步步来，不着急～",
    "今天也陪家人学一点吧",
    "点错了也没关系，再戳一下！",
  ],

  homeCards: [
    { icon: "📚", title: "浏览教程", desc: "图文步骤，照着做不会翻车", to: "/browse" },
    { icon: "🗂️", title: "按分类找", desc: "美食 / 手工 / 数码 / 生活 / 园艺", to: "/category" },
    { icon: "📸", title: "圈圈", desc: "家人的动态小广场", to: "/circle" },
    { icon: "📝", title: "上传教程", desc: "把你会的，一点点教给家人", to: "/upload" },
    { icon: "🏡", title: "我的小天地", desc: "学习进度、收藏与待解答", to: "/profile" },
  ],

  bgImage: "",
  bgEnabled: false,
  browseBgImage: "",
  browseBgEnabled: false,

  customCategories: [],
};

/* Migrate old settings shape → new shape */
function migrate(old: Record<string, unknown>): Partial<SiteSettings> {
  const m: Partial<SiteSettings> = {};
  if (old.avatarType) {
    m.heroCharType = old.avatarType === "custom" ? "miffy" : (old.avatarType as CharacterType);
    m.logoCharType = m.heroCharType;
  }
  if (old.avatarStroke) {
    m.heroStroke = old.avatarStroke as string;
    m.logoStroke = old.avatarStroke as string;
  }
  if (old.avatarFill) {
    m.heroFill = old.avatarFill as string;
    m.logoFill = old.avatarFill as string;
  }
  if (typeof old.avatarCheek === "boolean") {
    m.heroCheek = old.avatarCheek;
    m.logoCheek = old.avatarCheek;
  }
  if (typeof old.avatarCrown === "boolean") {
    m.heroDecoration = old.avatarCrown ? "crown" : "none";
    m.logoDecoration = m.heroDecoration;
  }
  if (old.avatarCrownColor) {
    m.heroDecorationColor = old.avatarCrownColor as string;
    m.logoDecorationColor = old.avatarCrownColor as string;
  }
  if (old.avatarCustomUrl) {
    m.heroCustomUrl = old.avatarCustomUrl as string;
    m.logoCustomUrl = old.avatarCustomUrl as string;
  }
  return m;
}

interface SettingsContextValue {
  settings: SiteSettings;
  update: (partial: Partial<SiteSettings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const STORAGE_KEY = "siteSettings";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // If old shape detected (has avatarType but not heroCharType), migrate
        if (parsed.avatarType && !parsed.heroCharType) {
          return { ...defaultSettings, ...migrate(parsed), ...stripOld(parsed) };
        }
        return { ...defaultSettings, ...parsed };
      }
    } catch {
      /* localStorage may be unavailable */
    }
    return defaultSettings;
  });

  // re-read settings when data is synced from other devices
  useEffect(() => {
    const onSync = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch { /* noop */ }
    };
    window.addEventListener("fth-data-synced", onSync);
    return () => window.removeEventListener("fth-data-synced", onSync);
  }, []);

  const update = (partial: Partial<SiteSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* quota exceeded — keep in-memory only */
      }
      return next;
    });
    scheduleBackup();
  };

  const reset = () => {
    setSettings(defaultSettings);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}

/* Remove old avatar* keys from stored object */
function stripOld(obj: Record<string, unknown>): Partial<SiteSettings> {
  const { avatarType, avatarStroke, avatarFill, avatarCheek, avatarCrown, avatarCrownColor, avatarCustomUrl, ...rest } = obj;
  return rest as Partial<SiteSettings>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

/* ===== Color presets ===== */
export const colorPresets = [
  { name: "经典白", stroke: "#2C2C2C", fill: "#FFFFFF" },
  { name: "蜜桃粉", stroke: "#C45A7A", fill: "#FFF5F8" },
  { name: "天空蓝", stroke: "#4A7BB5", fill: "#F0F6FF" },
  { name: "薄荷绿", stroke: "#4A9D7E", fill: "#EAF6EF" },
  { name: "薰衣草", stroke: "#8A6CB5", fill: "#F5EEFA" },
  { name: "焦糖棕", stroke: "#8D6E63", fill: "#FFF8E1" },
  { name: "奶茶色", stroke: "#B89878", fill: "#FAF0E4" },
  { name: "晚霞橙", stroke: "#D67E22", fill: "#FFF3E0" },
];

export const rilakkumaPresets = [
  { name: "经典棕", stroke: "#795548", fill: "#D7CCC8" },
  { name: "蜜糖棕", stroke: "#A1887F", fill: "#EFEBE9" },
  { name: "抹茶熊", stroke: "#5D7A3A", fill: "#E8EFD8" },
  { name: "草莓熊", stroke: "#C45A5A", fill: "#FDE8E8" },
];

export const decorationOptions: { value: DecorationType; label: string; emoji: string }[] = [
  { value: "none", label: "无装饰", emoji: "✨" },
  { value: "crown", label: "小皇冠", emoji: "👑" },
  { value: "heart", label: "小爱心", emoji: "💗" },
  { value: "apple", label: "小苹果", emoji: "🍎" },
];

export const decorationColors = [
  "#F2C94C", "#E74C3C", "#FF8AB3", "#9B59B6",
  "#3498DB", "#2ECC71", "#E67E22", "#1ABC9C",
];
