import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Upload, Menu, X, PawPrint, Settings as Cog, LogOut } from "lucide-react";
import { HeroAvatar, LogoMark } from "../components/Miffy";
import { useSettings } from "../lib/settings";
import { useAuth } from "../lib/auth";

const nav = [
  { to: "/", label: "主页" },
  { to: "/browse", label: "教程" },
  { to: "/category", label: "分类" },
  { to: "/circle", label: "圈圈" },
  { to: "/profile", label: "我的" },
];

export function Landing() {
  const { settings } = useSettings();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState(settings.petMessages[0] ?? "来学点新东西吧～");
  const [boop, setBoop] = useState(false);

  if (!user) return <Navigate to="/members" replace />;

  const poke = () => {
    setBoop(true);
    const msgs = settings.petMessages.length ? settings.petMessages : ["来学点新东西吧～"];
    setMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    window.setTimeout(() => setBoop(false), 600);
  };

  const bgStyle = settings.bgEnabled && settings.bgImage
    ? { backgroundImage: `url(${settings.bgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }
    : undefined;

  return (
    <div
      className="page-enter relative min-h-screen overflow-hidden bg-gradient-to-b from-[#fce4ec] via-[#f8d7e8] to-[#f3b5cf] text-[#3a1a2a]"
      style={bgStyle}
    >
      {/* water ripple orbs */}
      <div className="ripple-orb" style={{ top: "-40px", right: "-60px", width: "280px", height: "280px", background: "radial-gradient(circle, rgba(255,182,193,0.4), transparent)" }} />
      <div className="ripple-orb" style={{ top: "30%", left: "-80px", width: "320px", height: "320px", background: "radial-gradient(circle, rgba(255,218,222,0.35), transparent)", animationDelay: "-4s" }} />
      <div className="ripple-orb" style={{ bottom: "-40px", right: "25%", width: "240px", height: "240px", background: "radial-gradient(circle, rgba(248,195,208,0.3), transparent)", animationDelay: "-8s" }} />

      <div className="relative z-10">
        {/* glass nav */}
        <header className="sticky top-0 z-30 px-4 pt-4">
          <nav className="glass mx-auto flex max-w-3xl items-center gap-2 rounded-2xl px-4 py-2.5">
            <Link to="/" className="flex items-center gap-2">
              <LogoMark className="h-9 w-9" />
              <span className="font-song text-lg font-bold text-[#8B3A5A]">{settings.siteName}</span>
            </Link>
            <div className="ml-auto hidden items-center gap-1 md:flex">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="rounded-full px-3.5 py-2 text-sm text-[#8B3A5A]/80 transition hover:bg-[#C45A7A]/8 hover:text-[#8B3A5A]"
                >
                  {n.label}
                </Link>
              ))}
            </div>
            <Link
              to="/upload"
              className="ml-1 hidden items-center gap-1.5 rounded-full bg-[#C45A7A] px-4 py-2 text-sm text-white transition hover:bg-[#A04068] sm:inline-flex"
            >
              <Upload className="h-4 w-4" /> 上传教程
            </Link>
            <Link
              to="/settings"
              className="ml-1 rounded-full p-2 text-[#8B3A5A] transition hover:bg-[#C45A7A]/8"
              aria-label="设置"
            >
              <Cog className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              className="ml-auto rounded-full p-2 text-[#8B3A5A] md:hidden"
              aria-label="菜单"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </nav>
          {open && (
            <div className="glass mx-auto mt-2 max-w-3xl rounded-2xl p-2 md:hidden">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm text-[#8B3A5A] hover:bg-[#C45A7A]/5"
                >
                  {n.label}
                </Link>
              ))}
              <Link
                to="/upload"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-xl bg-[#C45A7A] px-4 py-2.5 text-center text-sm text-white"
              >
                上传教程
              </Link>
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-xl px-4 py-2.5 text-center text-sm text-[#8B3A5A] hover:bg-[#C45A7A]/5"
              >
                设置
              </Link>
            </div>
          )}
        </header>

        {/* hero */}
        <section className="mx-auto max-w-3xl px-4 pb-6 pt-10 text-center sm:pt-14">
          {/* hero avatar medallion */}
          <div className="glass mx-auto mb-6 flex h-44 w-44 items-center justify-center overflow-hidden rounded-full shadow-[0_18px_40px_rgba(196,90,122,0.18)]">
            <HeroAvatar className="h-32 w-32" cheek />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C45A7A]">
            {settings.heroBadge}
          </span>
          <h1 className="font-song mt-3 text-4xl font-bold leading-[1.2] text-[#3a1a2a] sm:text-5xl">
            {settings.heroTitle.split("\n").map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#8a5a6a]">
            {settings.heroDesc}
          </p>
          <Link
            to="/browse"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#C45A7A] px-6 py-3 text-sm text-white shadow-[0_12px_32px_rgba(196,90,122,0.22)] transition hover:bg-[#A04068]"
          >
            {settings.heroButtonText} <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* quick nav cards — customizable from settings */}
        <section className="mx-auto max-w-3xl px-4 py-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {settings.homeCards.map((c, i) => (
              <Link
                key={i}
                to={c.to}
                className="glass group flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C45A7A]/8 text-xl">
                  {c.icon}
                </span>
                <div className="flex-1">
                  <p className="font-song text-base font-bold text-[#8B3A5A]">{c.title}</p>
                  <p className="text-xs text-[#8a5a6a]">{c.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#C45A7A] transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>

        {/* pet companion */}
        <section className="mx-auto max-w-3xl px-4 py-6">
          <div className="glass flex flex-col items-center gap-6 rounded-3xl p-8 sm:flex-row sm:text-left">
            <button onClick={poke} className="relative shrink-0" aria-label="戳一下">
              <span
                className={`flex h-28 w-28 items-center justify-center rounded-full bg-white/80 shadow-[inset_0_2px_8px_rgba(196,90,122,0.08)] ${
                  boop ? "animate-floaty" : ""
                }`}
              >
                <LogoMark
                  className={`h-20 w-20 transition ${boop ? "scale-110" : ""}`}
                  cheek
                />
              </span>
            </button>
            <div className="flex-1 text-center sm:text-left">
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#C45A7A]">
                <PawPrint className="h-3.5 w-3.5" /> 家庭小助手
              </span>
              <p className="font-song mt-1 text-xl font-bold text-[#3a1a2a]">{settings.petName}</p>
              <div className="relative mt-3 inline-block rounded-2xl bg-white/80 px-4 py-2.5 text-sm text-[#8B3A5A] shadow-sm">
                {msg}
                <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white/80 sm:hidden" />
                <span className="absolute -left-1.5 top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 bg-white/80 sm:block" />
              </div>
              <p className="mt-2 text-xs text-[#8a5a6a]">戳一下，换个鼓励～</p>
            </div>
          </div>
        </section>

        {/* footer */}
        <footer className="px-4 pb-10 pt-6 text-center">
          <p className="text-xs text-[#8a5a6a]">{settings.siteName} · 用爱与耐心，慢慢来</p>
          <p className="mt-1 text-[11px] text-[#8a5a6a]/70">© {new Date().getFullYear()} {user.name} 的小角落 · <Link to="/members" className="underline">切换成员</Link> · <button onClick={() => logout()} className="underline">退出</button></p>
        </footer>
      </div>
    </div>
  );
}
