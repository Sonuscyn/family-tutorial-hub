import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { categories, tutorials } from "../data/tutorials";
import { LogoMark } from "../components/Miffy";
import { useSettings } from "../lib/settings";

const blurb: Record<string, string> = {
  美食: "把家里最常做的菜，整理成不会翻车的步骤。",
  手工: "毛线、蜡烛、小物件，两晚上就能做完一件。",
  数码: "手机、电脑的小麻烦，几步搞定不折腾。",
  生活: "收纳、清洁、居家小智慧，过日子的手艺。",
  园艺: "阳台上的小绿洲，从一盆多肉开始。",
};

const defaultEmoji: Record<string, string> = {
  美食: "🍲", 手工: "🧶", 数码: "📱", 生活: "🧺", 园艺: "🌿",
};

export function Category() {
  const { settings } = useSettings();
  const cats = categories.filter((c) => c !== "全部");
  const customCats = settings.customCategories;

  const getEmoji = (name: string) => {
    const custom = customCats.find((c) => c.name === name);
    return custom?.emoji || defaultEmoji[name] || "📌";
  };

  const getBlurb = (name: string) => blurb[name] || "自定义分类";

  return (
    <div className="page-enter container-app py-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">按分类浏览</h1>
          <p className="mt-1 text-sm text-ink-soft">想学哪样，就点哪样。</p>
        </div>
        <LogoMark className="h-12 w-12 animate-floaty" cheek />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cats.map((c) => {
          const count = tutorials.filter((t) => t.category === c).length;
          return (
            <Link
              key={c}
              to={`/browse?cat=${encodeURIComponent(c)}`}
              className="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-miffy-soft text-2xl">
                {getEmoji(c)}
              </span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-ink transition group-hover:text-miffy-dark">{c}</h2>
                <p className="text-sm text-ink-soft">{getBlurb(c)}</p>
              </div>
              <span className="text-sm text-ink-muted">{count} 篇</span>
              <ArrowRight className="h-4 w-4 text-ink-muted transition group-hover:translate-x-1" />
            </Link>
          );
        })}
        {customCats.map((c) => (
          <Link
            key={c.name}
            to={`/browse?cat=${encodeURIComponent(c.name)}`}
            className="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-miffy-soft text-2xl">
              {c.emoji}
            </span>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-ink transition group-hover:text-miffy-dark">{c.name}</h2>
              <p className="text-sm text-ink-soft">自定义分类</p>
            </div>
            <span className="text-sm text-ink-muted">0 篇</span>
            <ArrowRight className="h-4 w-4 text-ink-muted transition group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
