import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Lock, Image as ImageIcon, Type, Palette, Check, RotateCcw,
  Upload, Eye, EyeOff, X, MessageSquare, Home, Tag, KeyRound, Plus,
  Cloud, Download, Loader2, ShieldAlert,
} from "lucide-react";
import {
  Miffy, HeroAvatar, LogoMark,
} from "../components/Miffy";
import {
  useSettings, colorPresets, rilakkumaPresets,
  decorationOptions, decorationColors,
  type CharacterType, type DecorationType,
} from "../lib/settings";
import {
  hasToken, setToken as saveGhToken, getToken,
  backupToGitHub, restoreFromGitHub,
} from "../lib/githubSync";
import {
  getSupabaseConfig, setSupabaseConfig, isSupabaseReady, SQL_SCHEMA,
} from "../lib/supabase";
import {
  isLeanReady, startLeanSync, stopLeanSync,
  getLeanId, getLeanKey, getLeanServer,
  setLeanConfig, clearLeanConfig,
} from "../lib/leanSync";

export function Settings() {
  const { settings, update, reset } = useSettings();
  const [unlocked, setUnlocked] = useState(false);
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [bgError, setBgError] = useState("");
  const [browseBgError, setBrowseBgError] = useState("");
  const [messagesText, setMessagesText] = useState(() => settings.petMessages.join("\n"));
  const msgDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashSaved = () => { setSaved(true); window.setTimeout(() => setSaved(false), 1600); };

  const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const tryUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === settings.password) { setUnlocked(true); setError(""); }
    else setError("密码不对哦，再试试～");
  };

  const onHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    update({ heroCustomUrl: await fileToDataUrl(f) }); flashSaved();
  };
  const onLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    update({ logoCustomUrl: await fileToDataUrl(f) }); flashSaved();
  };
  const onBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    update({ bgImage: await fileToDataUrl(f), bgEnabled: true }); setBgError(""); flashSaved();
  };
  const onBrowseBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    update({ browseBgImage: await fileToDataUrl(f), browseBgEnabled: true }); setBrowseBgError(""); flashSaved();
  };

  /* ===== Password Gate ===== */
  if (!unlocked) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#fce4ec] via-[#f8d7e8] to-[#f3b5cf] px-4">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-white/30 blur-3xl" />
        <div className="glass relative z-10 w-full max-w-sm rounded-3xl p-8">
          <div className="glass mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-lg">
            <LogoMark className="h-14 w-14" cheek />
          </div>
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.25em] text-[#C45A7A]">
              <Lock className="h-3.5 w-3.5" /> 管理设置
            </span>
            <h1 className="font-song mt-2 text-2xl font-bold text-[#8B3A5A]">输入密码</h1>
            <p className="mt-1 text-sm text-[#B07090]">只有知道密码的人才能改哦</p>
          </div>
          <form onSubmit={tryUnlock} className="space-y-4">
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={(e) => { setPwd(e.target.value); setError(""); }}
                placeholder="请输入密码"
                autoFocus
                className="w-full rounded-2xl border border-[#C45A7A]/15 bg-white/70 px-4 py-3 pr-12 text-center text-lg tracking-[0.3em] text-[#8B3A5A] outline-none focus:border-[#C45A7A]/40 focus:ring-2 focus:ring-[#C45A7A]/10"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B07090] hover:text-[#8B3A5A]">
                {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {error && <p className="text-center text-sm text-[#e07a5f]">{error}</p>}
            <button type="submit"
              className="w-full rounded-2xl bg-[#C45A7A] px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-[#A04068]">
              进入设置
            </button>
          </form>
          <Link to="/" className="mt-4 flex items-center justify-center gap-1.5 text-sm text-[#B07090] hover:text-[#8B3A5A]">
            <ArrowLeft className="h-4 w-4" /> 返回首页
          </Link>
        </div>
      </div>
    );
  }

  /* ===== Settings Panel ===== */
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#fce4ec] via-[#f8d7e8] to-[#f3b5cf] text-[#3a1a2a]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-1/3 h-80 w-80 rounded-full bg-white/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[#fce4ec]/60 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-2xl px-4 pb-16">
        {/* top bar */}
        <header className="flex items-center justify-between pt-6">
          <Link to="/" className="glass flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-[#8B3A5A] hover:bg-white/95">
            <ArrowLeft className="h-4 w-4" /> 返回首页
          </Link>
          <button onClick={() => setUnlocked(false)}
            className="glass flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-[#8B3A5A] hover:bg-white/95">
            <Lock className="h-4 w-4" /> 锁定
          </button>
        </header>

        {/* title */}
        <div className="mt-8 text-center">
          <div className="glass mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-lg">
            <LogoMark className="h-11 w-11" cheek />
          </div>
          <h1 className="font-song text-3xl font-bold text-[#8B3A5A]">页面设置</h1>
          <p className="mt-1 text-sm text-[#B07090]">改完即时生效，自动保存</p>
        </div>

        {saved && (
          <div className="fixed left-1/2 top-6 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#C45A7A] px-5 py-2.5 text-sm text-white shadow-lg">
            <Check className="h-4 w-4" /> 已保存
          </div>
        )}

        {error && (
          <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-[#e07a5f] px-5 py-2.5 text-sm text-white shadow-lg">
            {error}
          </div>
        )}

        {/* ===== Site Identity ===== */}
        <Section icon={<Tag className="h-4 w-4" />} title="站点信息">
          <Field label="站点名称" value={settings.siteName} onChange={v => update({ siteName: v })} placeholder="家庭教程站" onSaved={flashSaved} />
          <Field label="你的称呼" value={settings.userName} onChange={v => update({ userName: v })} placeholder="家人" onSaved={flashSaved} />
        </Section>

        {/* ===== Hero Avatar ===== */}
        <Section icon={<Palette className="h-4 w-4" />} title="大头像（首页大头像）">
          <CharacterEditor
            kind="hero"
            settings={settings}
            update={update}
            flashSaved={flashSaved}
            onUpload={onHeroUpload}
          />
        </Section>

        {/* ===== Logo Mark ===== */}
        <Section icon={<Palette className="h-4 w-4" />} title="小标志（导航栏等小图标）">
          <CharacterEditor
            kind="logo"
            settings={settings}
            update={update}
            flashSaved={flashSaved}
            onUpload={onLogoUpload}
          />
        </Section>

        {/* ===== Text ===== */}
        <Section icon={<Type className="h-4 w-4" />} title="文字内容">
          <Field label="顶部标签" value={settings.heroBadge} onChange={v => update({ heroBadge: v })} placeholder="欢迎" onSaved={flashSaved} />
          <Field label="大标题" value={settings.heroTitle} onChange={v => update({ heroTitle: v })} placeholder="把温暖的知识，一点点教给家人" onSaved={flashSaved} textarea rows={2} hint="用「换行」可以分两行显示" />
          <Field label="描述文字" value={settings.heroDesc} onChange={v => update({ heroDesc: v })} placeholder="家里的学习小角落…" onSaved={flashSaved} textarea rows={3} />
          <Field label="按钮文字" value={settings.heroButtonText} onChange={v => update({ heroButtonText: v })} placeholder="进入教程" onSaved={flashSaved} />
          <Field label="米菲名片标题" value={settings.petName} onChange={v => update({ petName: v })} placeholder="米菲陪你一起学" onSaved={flashSaved} />
        </Section>

        {/* ===== Encouragement Messages ===== */}
        <Section icon={<MessageSquare className="h-4 w-4" />} title="鼓励语">
          <p className="mb-2 text-xs text-[#B07090]">戳一下米菲会随机弹出一条，每行写一条，随时可以加</p>
          <textarea
            value={messagesText}
            onChange={e => {
              setMessagesText(e.target.value);
              if (msgDebounce.current) clearTimeout(msgDebounce.current);
              msgDebounce.current = setTimeout(() => {
                const lines = e.target.value.split("\n").filter(l => l.trim());
                update({ petMessages: lines.length ? lines : ["来学点新东西吧～"] });
                flashSaved();
              }, 600);
            }}
            placeholder={"来学点新东西吧～\n不会的随时提问哦！\n一步步来，不着急～"}
            rows={6}
            className="w-full resize-none rounded-2xl border border-[#C45A7A]/15 bg-white/70 px-4 py-3 text-sm text-[#8B3A5A] outline-none focus:border-[#C45A7A]/40 focus:ring-2 focus:ring-[#C45A7A]/10"
          />
          <p className="mt-1.5 text-[11px] text-[#B07090]/70">当前 {settings.petMessages.length} 条鼓励语</p>
        </Section>

        {/* ===== Home Cards ===== */}
        <Section icon={<Home className="h-4 w-4" />} title="首页快捷卡片">
          <div className="space-y-3">
            {settings.homeCards.map((card, i) => (
              <div key={i} className="flex items-start gap-2 rounded-2xl bg-white/50 p-3">
                <input
                  type="text"
                  value={card.icon}
                  onChange={e => {
                    const next = [...settings.homeCards];
                    next[i] = { ...card, icon: e.target.value };
                    update({ homeCards: next });
                  }}
                  className="w-10 shrink-0 rounded-xl border border-[#C45A7A]/15 bg-white/70 px-2 py-2 text-center text-lg outline-none focus:border-[#C45A7A]/40"
                />
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={card.title}
                    onChange={e => {
                      const next = [...settings.homeCards];
                      next[i] = { ...card, title: e.target.value };
                      update({ homeCards: next });
                    }}
                    placeholder="标题"
                    className="w-full rounded-xl border border-[#C45A7A]/15 bg-white/70 px-3 py-1.5 text-sm text-[#8B3A5A] outline-none focus:border-[#C45A7A]/40"
                  />
                  <input
                    type="text"
                    value={card.desc}
                    onChange={e => {
                      const next = [...settings.homeCards];
                      next[i] = { ...card, desc: e.target.value };
                      update({ homeCards: next });
                    }}
                    placeholder="描述"
                    className="w-full rounded-xl border border-[#C45A7A]/15 bg-white/70 px-3 py-1.5 text-xs text-[#B07090] outline-none focus:border-[#C45A7A]/40"
                  />
                  <input
                    type="text"
                    value={card.to}
                    onChange={e => {
                      const next = [...settings.homeCards];
                      next[i] = { ...card, to: e.target.value };
                      update({ homeCards: next });
                    }}
                    placeholder="/browse"
                    className="w-full rounded-xl border border-[#C45A7A]/15 bg-white/70 px-3 py-1.5 text-xs text-[#B07090] outline-none focus:border-[#C45A7A]/40"
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ===== Landing Background ===== */}
        <Section icon={<ImageIcon className="h-4 w-4" />} title="首页背景图片">
          <BgEditor
            enabled={settings.bgEnabled}
            image={settings.bgImage}
            onUpload={onBgUpload}
            onToggle={() => { update({ bgEnabled: !settings.bgEnabled }); flashSaved(); }}
            onDelete={() => { update({ bgEnabled: false, bgImage: "" }); flashSaved(); }}
            error={bgError}
            defaultLabel="当前使用默认淡粉背景"
          />
        </Section>

        {/* ===== Browse Background ===== */}
        <Section icon={<ImageIcon className="h-4 w-4" />} title="教程区背景图片">
          <BgEditor
            enabled={settings.browseBgEnabled}
            image={settings.browseBgImage}
            onUpload={onBrowseBgUpload}
            onToggle={() => { update({ browseBgEnabled: !settings.browseBgEnabled }); flashSaved(); }}
            onDelete={() => { update({ browseBgEnabled: false, browseBgImage: "" }); flashSaved(); }}
            error={browseBgError}
            defaultLabel="当前使用默认奶油色背景"
          />
        </Section>

        {/* ===== Custom Categories ===== */}
        <Section icon={<Tag className="h-4 w-4" />} title="自定义分类">
          <p className="mb-3 text-xs text-[#B07090]">添加自己的分类，每个分类可以选一个 emoji 图标</p>
          <div className="mb-3 space-y-2">
            {settings.customCategories.map((cat, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-white/50 p-2">
                <input
                  type="text"
                  value={cat.emoji}
                  onChange={e => {
                    const next = [...settings.customCategories];
                    next[i] = { ...cat, emoji: e.target.value };
                    update({ customCategories: next });
                  }}
                  className="w-10 shrink-0 rounded-lg border border-[#C45A7A]/15 bg-white/70 px-2 py-1.5 text-center text-lg outline-none"
                />
                <input
                  type="text"
                  value={cat.name}
                  onChange={e => {
                    const next = [...settings.customCategories];
                    next[i] = { ...cat, name: e.target.value };
                    update({ customCategories: next });
                  }}
                  className="flex-1 rounded-lg border border-[#C45A7A]/15 bg-white/70 px-3 py-1.5 text-sm text-[#8B3A5A] outline-none"
                />
                <button
                  onClick={() => {
                    update({ customCategories: settings.customCategories.filter((_, j) => j !== i) });
                    flashSaved();
                  }}
                  className="rounded-lg p-1.5 text-[#e07a5f] hover:bg-[#e07a5f]/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              update({ customCategories: [...settings.customCategories, { name: "新分类", emoji: "📌" }] });
              flashSaved();
            }}
            className="flex items-center gap-1.5 rounded-full bg-[#C45A7A] px-4 py-2 text-sm text-white hover:bg-[#A04068]"
          >
            <Plus className="h-4 w-4" /> 添加分类
          </button>
        </Section>

        {/* ===== Password ===== */}
        <Section icon={<KeyRound className="h-4 w-4" />} title="修改密码">
          <PasswordEditor settings={settings} update={update} flashSaved={flashSaved} />
        </Section>

        {/* ===== Data Sync ===== */}
        <Section icon={<Cloud className="h-4 w-4" />} title="数据同步（Supabase）">
          <SupabaseConfig />
        </Section>

        <Section icon={<Cloud className="h-4 w-4" />} title="实时同步（LeanCloud）">
          <LeanSyncConfig />
        </Section>

        <Section icon={<Cloud className="h-4 w-4" />} title="手动备份（GitHub）">
          <DataSync />
        </Section>

        {/* reset */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              if (confirm("确定恢复默认设置吗？所有改动都会丢失哦")) { reset(); flashSaved(); }
            }}
            className="inline-flex items-center gap-1.5 text-sm text-[#B07090] hover:text-[#8B3A5A]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> 恢复默认
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Helper sub-components ===== */

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass mt-6 rounded-3xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C45A7A]/8 text-[#C45A7A]">{icon}</span>
        <h2 className="font-song text-lg font-bold text-[#8B3A5A]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, onSaved, textarea, rows = 1, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  onSaved: () => void; textarea?: boolean; rows?: number; hint?: string;
}) {
  const [local, setLocal] = useState(value);
  const d = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sync = (v: string) => {
    setLocal(v);
    if (d.current) clearTimeout(d.current);
    d.current = setTimeout(() => { onChange(v); onSaved(); }, 500);
  };
  return (
    <div className="mb-4 last:mb-0">
      <label className="mb-1.5 block text-xs font-medium text-[#B07090]">{label}</label>
      {textarea ? (
        <textarea value={local} onChange={e => sync(e.target.value)} placeholder={placeholder} rows={rows}
          className="w-full resize-none rounded-2xl border border-[#C45A7A]/15 bg-white/70 px-4 py-3 text-sm text-[#8B3A5A] outline-none focus:border-[#C45A7A]/40 focus:ring-2 focus:ring-[#C45A7A]/10" />
      ) : (
        <input type="text" value={local} onChange={e => sync(e.target.value)} placeholder={placeholder}
          className="w-full rounded-2xl border border-[#C45A7A]/15 bg-white/70 px-4 py-3 text-sm text-[#8B3A5A] outline-none focus:border-[#C45A7A]/40 focus:ring-2 focus:ring-[#C45A7A]/10" />
      )}
      {hint && <p className="mt-1 text-[11px] text-[#B07090]/70">{hint}</p>}
    </div>
  );
}

function CharacterEditor({ kind, settings, update, flashSaved, onUpload }: {
  kind: "hero" | "logo";
  settings: import("../lib/settings").SiteSettings;
  update: (p: Partial<import("../lib/settings").SiteSettings>) => void;
  flashSaved: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const pfx = kind;
  const charType = (settings as any)[`${pfx}CharType`] as CharacterType;
  const stroke = (settings as any)[`${pfx}Stroke`] as string;
  const fill = (settings as any)[`${pfx}Fill`] as string;
  const cheek = (settings as any)[`${pfx}Cheek`] as boolean;
  const decoration = (settings as any)[`${pfx}Decoration`] as DecorationType;
  const decoColor = (settings as any)[`${pfx}DecorationColor`] as string;
  const customUrl = (settings as any)[`${pfx}CustomUrl`] as string;
  const Avatar = kind === "hero" ? HeroAvatar : LogoMark;

  const presets = charType === "rilakkuma" ? rilakkumaPresets : colorPresets;

  const set = (vals: Record<string, any>) => {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(vals)) obj[`${pfx}${k[0].toUpperCase()}${k.slice(1)}`] = v;
    update(obj);
    flashSaved();
  };

  return (
    <>
      {/* preview */}
      <div className="mb-4 flex items-center gap-4">
        <div className="glass flex h-20 w-20 shrink-0 items-center justify-center rounded-full shadow-md">
          {customUrl ? (
            <img src={customUrl} alt="自定义" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <Avatar className="h-14 w-14" cheek />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#8B3A5A]">
            {customUrl ? "自定义图片" : `${charType === "miffy" ? "米菲兔" : "轻松熊"}`}
          </p>
          <p className="mt-0.5 text-xs text-[#B07090]">选角色、配色、装饰物，自由搭配</p>
        </div>
      </div>

      {/* character selector */}
      <div className="mb-3 flex gap-2">
        {(["miffy", "rilakkuma"] as CharacterType[]).map(c => (
          <button key={c} onClick={() => set({ charType: c, customUrl: "" })}
            className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm transition ${
              charType === c && !customUrl ? "border-[#C45A7A] bg-white/80" : "border-transparent bg-white/50 hover:bg-white/70"
            }`}>
            <Miffy className="h-6 w-6" character={c} stroke={stroke} fill={fill} decoration={decoration} decorationColor={decoColor} />
            {c === "miffy" ? "米菲兔" : "轻松熊"}
          </button>
        ))}
      </div>

      {/* color presets */}
      {!customUrl && (
        <div className="mb-3 grid grid-cols-4 gap-2">
          {presets.map(p => {
            const active = stroke === p.stroke && fill === p.fill;
            return (
              <button key={p.name} onClick={() => set({ stroke: p.stroke, fill: p.fill })}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition ${
                  active ? "border-[#C45A7A] bg-white/80" : "border-transparent bg-white/50 hover:bg-white/70"
                }`}>
                <Miffy className="h-7 w-7" character={charType} stroke={p.stroke} fill={p.fill} cheek={cheek}
                  decoration={decoration} decorationColor={decoColor} />
                <span className="text-[10px] text-[#B07090]">{p.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* decoration selector */}
      {!customUrl && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-white/40 p-3">
          {decorationOptions.map(d => (
            <button key={d.value} onClick={() => set({ decoration: d.value })}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                decoration === d.value ? "bg-[#C45A7A] text-white" : "bg-white/60 text-[#B07090]"
              }`}>
              <span>{d.emoji}</span> {d.label}
            </button>
          ))}
          {decoration !== "none" && (
            <div className="flex items-center gap-1.5">
              {decorationColors.map(c => (
                <button key={c} onClick={() => set({ decorationColor: c })}
                  className={`h-5 w-5 rounded-full border-2 transition ${
                    decoColor === c ? "border-[#C45A7A] scale-110" : "border-white/60"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* cheek toggle */}
      {!customUrl && (
        <div className="mb-3">
          <button onClick={() => set({ cheek: !cheek })}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              cheek ? "bg-[#F4A0A0] text-white" : "bg-white/60 text-[#B07090]"
            }`}>
            {cheek ? "腮红已显示" : "腮红已隐藏"}
          </button>
        </div>
      )}

      {/* custom upload */}
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#C45A7A]/20 bg-white/40 py-3 text-sm text-[#B07090] hover:border-[#C45A7A]/40 hover:bg-white/60">
        <Upload className="h-4 w-4" /> 上传自定义图片
        <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
      </label>
      {customUrl && (
        <button onClick={() => { set({ customUrl: "" }); }}
          className="mt-2 flex items-center gap-1 text-xs text-[#B07090] hover:text-[#8B3A5A]">
          <X className="h-3 w-3" /> 移除自定义图片
        </button>
      )}
    </>
  );
}

function BgEditor({ enabled, image, onUpload, onToggle, onDelete, error, defaultLabel }: {
  enabled: boolean; image: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggle: () => void; onDelete: () => void;
  error: string; defaultLabel: string;
}) {
  return (
    <>
      <div className="mb-4 overflow-hidden rounded-2xl border border-[#C45A7A]/10">
        {enabled && image ? (
          <img src={image} alt="背景" className="h-32 w-full object-cover" />
        ) : (
          <div className="flex h-32 items-center justify-center bg-gradient-to-b from-[#fce4ec] to-[#f3b5cf] text-sm text-[#B07090]">
            {defaultLabel}
          </div>
        )}
      </div>
      {error && <p className="mb-2 text-sm text-[#e07a5f]">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-full bg-[#C45A7A] px-5 py-2.5 text-sm text-white hover:bg-[#A04068]">
          <Upload className="h-4 w-4" /> 上传背景图
          <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
        </label>
        {enabled && image && (
          <>
            <button onClick={onToggle}
              className="flex items-center gap-2 rounded-full bg-white/70 px-5 py-2.5 text-sm text-[#8B3A5A] hover:bg-white/90">
              <EyeOff className="h-4 w-4" /> 暂时隐藏
            </button>
            <button onClick={onDelete}
              className="flex items-center gap-2 rounded-full bg-white/70 px-5 py-2.5 text-sm text-[#e07a5f] hover:bg-white/90">
              <X className="h-4 w-4" /> 删除
            </button>
          </>
        )}
        {image && !enabled && (
          <button onClick={onToggle}
            className="flex items-center gap-2 rounded-full bg-white/70 px-5 py-2.5 text-sm text-[#8B3A5A] hover:bg-white/90">
            <Eye className="h-4 w-4" /> 重新显示
          </button>
        )}
      </div>
    </>
  );
}

function PasswordEditor({ settings, update, flashSaved }: {
  settings: import("../lib/settings").SiteSettings;
  update: (p: Partial<import("../lib/settings").SiteSettings>) => void;
  flashSaved: () => void;
}) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPwd !== settings.password) { setMsg("原密码不对哦"); return; }
    if (newPwd.length < 3) { setMsg("新密码至少 3 位"); return; }
    if (newPwd !== confirmPwd) { setMsg("两次输入不一致"); return; }
    update({ password: newPwd });
    setMsg("密码已修改 ✓");
    setOldPwd(""); setNewPwd(""); setConfirmPwd("");
    flashSaved();
    setTimeout(() => setMsg(""), 2000);
  };

  const inputCls = "w-full rounded-xl border border-[#C45A7A]/15 bg-white/70 px-3 py-2 text-sm text-[#8B3A5A] outline-none focus:border-[#C45A7A]/40";
  const type = show ? "text" : "password";

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="relative">
        <input type={type} value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder="原密码" className={inputCls + " pr-10"} />
        <button type="button" onClick={() => setShow(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#B07090]">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <input type={type} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="新密码" className={inputCls} />
      <input type={type} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="再输一次新密码" className={inputCls} />
      {msg && <p className={`text-sm ${msg.includes("✓") ? "text-green-600" : "text-[#e07a5f]"}`}>{msg}</p>}
      <button type="submit" className="rounded-full bg-[#C45A7A] px-5 py-2 text-sm text-white hover:bg-[#A04068]">
        确认修改
      </button>
    </form>
  );
}

/* ===== Data Sync Component ===== */
function DataSync() {
  const [tokenInput, setTokenInput] = useState(getToken());
  const [syncing, setSyncing] = useState<"backup" | "restore" | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const tokenSaved = hasToken();

  const saveToken = () => {
    saveGhToken(tokenInput.trim());
    setMsg("Token 已保存 ✓");
    setErr("");
    setTimeout(() => setMsg(""), 2000);
  };

  const doBackup = async () => {
    setSyncing("backup");
    setMsg(""); setErr("");
    const r = await backupToGitHub();
    setSyncing(null);
    if (r.ok) { setMsg("备份成功！数据已存到 GitHub ✓"); }
    else { setErr(r.error || "备份失败"); }
    setTimeout(() => { setMsg(""); setErr(""); }, 3000);
  };

  const doRestore = async () => {
    if (!confirm("从 GitHub 恢复数据会覆盖当前的本地数据，确定吗？")) return;
    setSyncing("restore");
    setMsg(""); setErr("");
    const r = await restoreFromGitHub();
    setSyncing(null);
    if (r.ok) {
      setMsg("恢复成功！正在刷新页面…");
      setTimeout(() => window.location.reload(), 1200);
    } else { setErr(r.error || "恢复失败"); }
    setTimeout(() => setErr(""), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl bg-[#FFF0F5] p-3 text-xs text-[#8B3A5A]">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>备份数据存到 GitHub 仓库里，重新部署也不怕丢。Token 只存在本机浏览器，不会上传。</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#8B3A5A]">GitHub Token</label>
        <div className="flex gap-2">
          <input
            type="password"
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            placeholder="ghp_..."
            className="flex-1 rounded-xl border border-[#C45A7A]/15 bg-white/70 px-3 py-2 text-sm text-[#8B3A5A] outline-none focus:border-[#C45A7A]/40"
          />
          <button
            onClick={saveToken}
            className="shrink-0 rounded-full bg-[#C45A7A]/10 px-4 py-2 text-sm text-[#C45A7A] transition hover:bg-[#C45A7A]/20"
          >
            保存
          </button>
        </div>
        {tokenSaved && (
          <p className="mt-1 text-xs text-[#B07090]">Token 已保存</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={doBackup}
          disabled={!tokenSaved || syncing !== null}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#C45A7A] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#A04068] disabled:opacity-40"
        >
          {syncing === "backup" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
          备份到 GitHub
        </button>
        <button
          onClick={doRestore}
          disabled={!tokenSaved || syncing !== null}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#C45A7A]/10 px-4 py-2.5 text-sm font-medium text-[#C45A7A] transition hover:bg-[#C45A7A]/20 disabled:opacity-40"
        >
          {syncing === "restore" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          从 GitHub 恢复
        </button>
      </div>

      {msg && <p className="text-sm text-green-600">{msg}</p>}
      {err && <p className="text-sm text-[#e07a5f]">{err}</p>}
    </div>
  );
}

/* ===== Supabase Config Component ===== */
function SupabaseConfig() {
  const { url: savedUrl, anonKey: savedAnon } = getSupabaseConfig();
  const [url, setUrl] = useState(savedUrl);
  const [anonKey, setAnonKey] = useState(savedAnon);
  const [saved, setSaved] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const ready = isSupabaseReady();

  const save = () => {
    setSupabaseConfig(url, anonKey);
    setSaved(true);
    setTimeout(() => { setSaved(false); window.location.reload(); }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl bg-[#FFF0F5] p-3 text-xs text-[#8B3A5A]">
        <Cloud className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p>配置 Supabase 后，家人在不同手机上发帖、上传教程都能实时同步。</p>
          <p className="mt-1 text-[#B07090]">免费注册：supabase.com → New Project → 获取 URL 和 anon key</p>
        </div>
      </div>

      {ready && (
        <p className="flex items-center gap-1.5 text-sm text-green-600">
          <Check className="h-4 w-4" /> Supabase 已连接，实时同步已开启
        </p>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#8B3A5A]">Supabase URL</label>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://xxx.supabase.co"
          className="w-full rounded-xl border border-[#C45A7A]/15 bg-white/70 px-3 py-2 text-sm text-[#8B3A5A] outline-none focus:border-[#C45A7A]/40"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#8B3A5A]">Anon Key</label>
        <input
          type="text"
          value={anonKey}
          onChange={e => setAnonKey(e.target.value)}
          placeholder="eyJhbGciOi..."
          className="w-full rounded-xl border border-[#C45A7A]/15 bg-white/70 px-3 py-2 text-sm text-[#8B3A5A] outline-none focus:border-[#C45A7A]/40"
        />
      </div>

      <button
        onClick={save}
        className="rounded-full bg-[#C45A7A] px-5 py-2 text-sm text-white hover:bg-[#A04068]"
      >
        {saved ? "已保存，正在刷新…" : "保存配置"}
      </button>

      <button
        onClick={() => setShowSql(v => !v)}
        className="block text-xs text-[#B07090] hover:text-[#8B3A5A]"
      >
        {showSql ? "隐藏" : "显示"} SQL 建表语句
      </button>

      {showSql && (
        <pre className="max-h-60 overflow-auto rounded-xl bg-[#2D1B2D] p-3 text-[10px] leading-relaxed text-[#E8D5E8]">
          {SQL_SCHEMA}
        </pre>
      )}
    </div>
  );
}

/* ===== LeanCloud Sync Config ===== */
function LeanSyncConfig() {
  const [appId, setAppId] = useState(getLeanId());
  const [appKey, setAppKey] = useState(getLeanKey());
  const [server, setServer] = useState(getLeanServer());
  const [running, setRunning] = useState(isLeanReady());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = () => {
    setError("");
    if (!appId.trim() || !appKey.trim()) {
      setError("App ID 和 App Key 都不能为空");
      return;
    }
    setLeanConfig(appId.trim(), appKey.trim(), server.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setRunning(true);
    startLeanSync();
  };

  const handleClear = () => {
    clearLeanConfig();
    setAppId(""); setAppKey(""); setServer("");
    setRunning(false);
    stopLeanSync();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl bg-[#FFF0F5] p-3 text-xs text-[#8B3A5A]">
        <Cloud className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p>配置后，家人在不同手机上发的动态、教程、设置会自动实时同步（30秒检查一次，国内可直连）。</p>
          <p className="mt-1 text-[#B07090]">
            注册 LeanCloud：打开 https://leancloud.cn 注册 → 创建应用 →
            设置 → 应用凭证 → 复制 AppID、AppKey、服务器地址
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#8B3A5A]">App ID</label>
        <input
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
          placeholder="如 kPXXX..."
          className="field text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#8B3A5A]">App Key</label>
        <input
          value={appKey}
          onChange={(e) => setAppKey(e.target.value)}
          placeholder="如 9VXXX..."
          className="field text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#8B3A5A]">服务器地址（可选）</label>
        <input
          value={server}
          onChange={(e) => setServer(e.target.value)}
          placeholder="如 https://xxx.lc-ea.shared.com"
          className="field text-sm"
        />
        <p className="mt-1 text-xs text-[#B07090]">国内节点填 https://xxx.lc-ea.shared.com；海外节点可留空</p>
      </div>

      {error && <p className="text-sm text-[#e07a5f]">{error}</p>}
      {saved && <p className="text-sm text-green-600">已保存并开启同步</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-full bg-[#C45A7A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#A0486A]"
        >
          <Check className="h-4 w-4" /> 保存并开启
        </button>
        {running && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 rounded-full bg-[#e07a5f]/10 px-5 py-2.5 text-sm font-medium text-[#e07a5f] transition hover:bg-[#e07a5f]/20"
          >
            <X className="h-4 w-4" /> 清除配置
          </button>
        )}
      </div>

      {running && (
        <p className="text-xs text-green-600">
          同步已开启 · 每30秒检查更新 · 有改动3秒后自动推送
        </p>
      )}
    </div>
  );
}
