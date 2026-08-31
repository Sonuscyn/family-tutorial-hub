import { Link } from "react-router-dom";
import { LogoMark } from "./Miffy";
import { useSettings } from "../lib/settings";

export function Footer() {
  const { settings } = useSettings();
  return (
    <footer className="mt-16 border-t border-wood/15 bg-cream-50">
      <div className="container-app flex flex-col items-center gap-3 py-8 text-center">
        <LogoMark className="h-8 w-8" />
        <p className="text-sm text-ink-soft">{settings.siteName} · 把温暖的知识一点点教给家人</p>
        <p className="text-xs text-ink-muted">用爱与耐心，慢慢来。</p>
        <Link to="/upload" className="text-sm text-miffy-dark hover:underline">
          上传一篇新教程 →
        </Link>
      </div>
    </footer>
  );
}
