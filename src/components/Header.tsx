import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Upload, Menu, X, Settings as Cog, LogOut, Users } from "lucide-react";
import { LogoMark } from "./Miffy";
import { useSettings } from "../lib/settings";
import { useAuth } from "../lib/auth";

export function Header() {
  const { settings } = useSettings();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(q.trim())}`);
    setOpen(false);
  };

  const navItems = [
    { to: "/", label: "主页" },
    { to: "/browse", label: "教程" },
    { to: "/category", label: "分类" },
    { to: "/circle", label: "圈圈" },
    { to: "/profile", label: "我的" },
  ];

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-30 border-b border-wood/15 bg-cream-100/85 backdrop-blur-md">
      <div className="container-app flex h-16 items-center gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <LogoMark className="h-9 w-9" />
          <span className="text-lg font-semibold tracking-tight text-ink">{settings.siteName}</span>
        </Link>

        <form onSubmit={onSearch} className="relative hidden flex-1 max-w-md md:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索教程…"
            className="w-full rounded-pill border border-wood/25 bg-cream-50 py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted/70 outline-none transition focus:border-miffy focus:ring-2 focus:ring-miffy/20"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`rounded-pill px-3.5 py-2 text-sm transition ${
                isActive(n.to) ? "bg-cream-200 text-ink" : "text-ink-soft hover:bg-cream-200 hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <Link to="/upload" className="btn-butter ml-1 hidden sm:inline-flex">
          <Upload className="h-4 w-4" /> 上传教程
        </Link>

        <Link
          to="/settings"
          className="ml-1 hidden rounded-pill p-2 text-ink-soft transition hover:bg-cream-200 hover:text-ink sm:inline-flex"
          aria-label="设置"
        >
          <Cog className="h-5 w-5" />
        </Link>

        {/* auth buttons */}
        {user ? (
          <Link
            to="/members"
            className="ml-1 hidden items-center gap-1.5 rounded-pill px-3 py-2 text-sm text-ink-soft transition hover:bg-cream-200 hover:text-ink sm:inline-flex"
          >
            <Users className="h-4 w-4" /> {user.name}
          </Link>
        ) : (
          <Link
            to="/members"
            className="ml-1 hidden items-center gap-1.5 rounded-pill bg-miffy px-3.5 py-2 text-sm text-white transition hover:bg-miffy-dark sm:inline-flex"
          >
            <Users className="h-4 w-4" /> 选家人
          </Link>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto rounded-pill p-2 text-ink hover:bg-cream-200 md:hidden"
          aria-label="菜单"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-wood/15 bg-cream-100 px-4 py-3 md:hidden">
          <form onSubmit={onSearch} className="relative mb-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索教程…"
              className="w-full rounded-pill border border-wood/25 bg-cream-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-miffy"
            />
          </form>
          <div className="flex flex-col gap-1">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-pill px-3.5 py-2.5 text-sm text-ink-soft hover:bg-cream-200 hover:text-ink"
              >
                {n.label}
              </Link>
            ))}
            <Link to="/upload" onClick={() => setOpen(false)} className="btn-butter mt-1 justify-center">
              <Upload className="h-4 w-4" /> 上传教程
            </Link>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-pill px-3.5 py-2.5 text-sm text-ink-soft hover:bg-cream-200 hover:text-ink"
            >
              <Cog className="h-4 w-4" /> 设置
            </Link>
            {user ? (
              <Link
                to="/members"
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center justify-center gap-1.5 rounded-pill bg-miffy px-3.5 py-2.5 text-sm text-white"
              >
                <Users className="h-4 w-4" /> {user.name} · 切换
              </Link>
            ) : (
              <Link
                to="/members"
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center justify-center gap-1.5 rounded-pill bg-miffy px-3.5 py-2.5 text-sm text-white"
              >
                <Users className="h-4 w-4" /> 选家人
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
