import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Flame,
  List,
  LayoutGrid,
  Heart,
  Layers,
} from "lucide-react";
import { tutorials, categories } from "../data/tutorials";
import { TutorialCard } from "../components/TutorialCard";
import { Avatar } from "../components/Avatar";
import { resolveImg } from "../lib/img";
import { LogoMark } from "../components/Miffy";
import { useSettings } from "../lib/settings";
import { loadUserTutorials } from "../lib/tutorialStore";
import type { Tutorial } from "../types";

export function Home() {
  const { settings } = useSettings();
  const [params] = useSearchParams();
  const q = params.get("q")?.trim() ?? "";
  const [category, setCategory] = useState(params.get("cat") ?? "全部");
  const [view, setView] = useState<"card" | "timeline">("card");
  const [syncTick, setSyncTick] = useState(0);

  // listen for data synced from other devices
  useEffect(() => {
    const onSync = () => setSyncTick(t => t + 1);
    window.addEventListener("fth-data-synced", onSync);
    return () => window.removeEventListener("fth-data-synced", onSync);
  }, []);

  const allCategories = useMemo(
    () => [...categories, ...settings.customCategories.map(c => c.name)],
    [settings.customCategories],
  );

  const allTutorials = useMemo(
    () => [...loadUserTutorials(), ...tutorials] as Tutorial[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [syncTick],
  );

  const newest = useMemo(
    () => [...allTutorials].sort((a, b) => b.date.localeCompare(a.date))[0],
    [allTutorials],
  );
  const mostLiked = useMemo(
    () => [...allTutorials].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0],
    [allTutorials],
  );

  const list = useMemo(() => {
    let r = allTutorials;
    if (category !== "全部") r = r.filter((t) => t.category === category);
    if (q) {
      const k = q.toLowerCase();
      r = r.filter(
        (t) =>
          t.title.toLowerCase().includes(k) ||
          t.intro.toLowerCase().includes(k) ||
          t.tags.some((tag) => tag.toLowerCase().includes(k)) ||
          t.author.toLowerCase().includes(k),
      );
    }
    return r;
  }, [allTutorials, category, q]);

  const bgStyle =
    settings.browseBgEnabled && settings.browseBgImage
      ? {
          backgroundImage: `url(${settings.browseBgImage})`,
          backgroundSize: "cover" as const,
          backgroundPosition: "center" as const,
          backgroundAttachment: "fixed" as const,
        }
      : undefined;

  return (
    <div className="page-enter container-app py-6" style={bgStyle}>
      {/* ===== Quick Index — Niki style horizontal pills ===== */}
      {!q && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                category === cat
                  ? "bg-wood text-white shadow-soft"
                  : "bg-cream-50 text-ink-soft hover:bg-cream-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ===== Smart Recommendations ===== */}
      {!q && category === "全部" && allTutorials.length > 0 && (
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <RecommendCard tutorial={newest} label="最新更新" icon={Clock} />
          <RecommendCard tutorial={mostLiked} label="最多收藏" icon={Flame} />
        </section>
      )}

      {/* ===== View toggle + section title ===== */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="shrink-0 text-lg font-semibold text-ink">
          {q ? `搜索「${q}」` : category === "全部" ? "全部教程" : category}
        </h2>
        <div className="flex items-center gap-1 rounded-pill bg-cream-100 p-1">
          <button
            onClick={() => setView("card")}
            className={`flex items-center gap-1 rounded-pill px-3 py-1.5 text-xs transition ${
              view === "card" ? "bg-white text-ink shadow-soft" : "text-ink-muted"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> 卡片
          </button>
          <button
            onClick={() => setView("timeline")}
            className={`flex items-center gap-1 rounded-pill px-3 py-1.5 text-xs transition ${
              view === "timeline" ? "bg-white text-ink shadow-soft" : "text-ink-muted"
            }`}
          >
            <List className="h-3.5 w-3.5" /> 时间线
          </button>
        </div>
      </div>

      {/* ===== Content ===== */}
      {list.length > 0 ? (
        view === "card" ? (
          <div className="masonry">
            {list.map((t) => (
              <TutorialCard key={t.id} tutorial={t} />
            ))}
          </div>
        ) : (
          <TimelineView tutorials={list} />
        )
      ) : (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <LogoMark className="h-16 w-16 animate-floaty" cheek />
          <div>
            <p className="text-lg font-medium text-ink">没有找到相关教程</p>
            <p className="mt-1 text-sm text-ink-muted">换个关键词，或者你来上传一篇？</p>
          </div>
          <Link to="/upload" className="btn-butter">
            上传新教程
          </Link>
        </div>
      )}
    </div>
  );
}

/* ===== Recommendation Card ===== */
function RecommendCard({
  tutorial,
  label,
  icon: Icon,
}: {
  tutorial: Tutorial | undefined;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  if (!tutorial) return null;
  return (
    <Link
      to={`/tutorial/${tutorial.id}`}
      className="card group flex items-center gap-4 overflow-hidden p-4 transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-cream-200">
        <img
          src={resolveImg(tutorial.coverPrompt, "square")}
          alt={tutorial.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-miffy-soft px-2 py-0.5 text-[10px] font-medium text-miffy-dark">
          <Icon className="h-3 w-3" /> {label}
        </span>
        <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-ink transition group-hover:text-miffy-dark">
          {tutorial.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-muted">
          <Avatar name={tutorial.author} color={tutorial.avatarColor} size={16} />
          <span>{tutorial.author}</span>
          <span className="flex items-center gap-0.5">
            <Heart className="h-3 w-3" /> {tutorial.likes ?? 0}
          </span>
          <span className="flex items-center gap-0.5">
            <Layers className="h-3 w-3" /> {tutorial.steps.length}步
          </span>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted transition group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ===== Timeline View ===== */
function TimelineView({ tutorials }: { tutorials: Tutorial[] }) {
  return (
    <div className="relative pl-6">
      {/* vertical line */}
      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-wood/30" />

      <div className="space-y-1">
        {tutorials.map((t, i) => (
          <Link
            key={t.id}
            to={`/tutorial/${t.id}`}
            className="group relative block rounded-2xl p-4 transition hover:bg-cream-50"
          >
            {/* dot on the line */}
            <span className="absolute -left-[18px] top-6 h-3 w-3 rounded-full border-2 border-wood bg-cream-50 transition group-hover:border-miffy group-hover:bg-miffy-soft" />

            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-ink-muted">{t.date}</span>
                  <span className="chip-outline px-2 py-0.5 text-[10px]">{t.category}</span>
                </div>
                <h3 className="mt-1 text-base font-semibold text-ink transition group-hover:text-miffy-dark">
                  {t.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{t.intro}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Avatar name={t.author} color={t.avatarColor} size={16} />
                    {t.author}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Layers className="h-3 w-3" /> {t.steps.length}步
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Heart className="h-3 w-3" /> {t.likes ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
