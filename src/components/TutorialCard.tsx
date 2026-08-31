import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Layers } from "lucide-react";
import type { Tutorial, ImageSize } from "../types";
import { resolveImg } from "../lib/img";
import { Avatar } from "./Avatar";

const aspectBySize: Record<ImageSize, string> = {
  square: "aspect-square",
  square_hd: "aspect-square",
  portrait_4_3: "aspect-[4/3]",
  portrait_16_9: "aspect-[9/16]",
  landscape_4_3: "aspect-[4/3]",
  landscape_16_9: "aspect-video",
};

export function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  const [saved, setSaved] = useState(!!tutorial.saved);

  return (
    <article className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
      <Link to={`/tutorial/${tutorial.id}`} className="block">
        <div className={`relative overflow-hidden ${aspectBySize[tutorial.coverSize] ?? "aspect-[4/3]"} bg-cream-200`}>
          <img
            src={resolveImg(tutorial.coverPrompt, tutorial.coverSize)}
            alt={tutorial.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 chip bg-cream-50/90 text-ink-soft shadow-sm backdrop-blur">
            {tutorial.category}
          </span>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/tutorial/${tutorial.id}`}>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ink transition group-hover:text-miffy-dark">
            {tutorial.title}
          </h3>
        </Link>
        <p className="mt-1.5 line-clamp-1 text-xs text-ink-muted">{tutorial.intro}</p>

        <div className="mt-3 flex items-center gap-2">
          <Avatar name={tutorial.author} color={tutorial.avatarColor} size={22} />
          <span className="text-xs text-ink-soft">{tutorial.author}</span>
          <span className="chip-outline px-2 py-0.5 text-[11px]">
            <Layers className="h-3 w-3" /> {tutorial.steps.length} 步
          </span>
          <button
            onClick={() => setSaved((v) => !v)}
            className="ml-auto rounded-full p-1.5 text-ink-muted transition hover:bg-cream-200 hover:text-miffy"
            aria-label={saved ? "取消收藏" : "收藏"}
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-miffy text-miffy" : ""}`} />
          </button>
        </div>
      </div>
    </article>
  );
}
