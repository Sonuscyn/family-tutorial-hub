import { useState } from "react";
import type { Annotation, ImageSize } from "../types";
import { resolveImg } from "../lib/img";

interface Props {
  imagePrompt: string;
  alt: string;
  size?: ImageSize;
  annotations?: Annotation[];
}

const aspectBySize: Record<ImageSize, string> = {
  square: "aspect-square",
  square_hd: "aspect-square",
  portrait_4_3: "aspect-[4/3]",
  portrait_16_9: "aspect-[9/16]",
  landscape_4_3: "aspect-[4/3]",
  landscape_16_9: "aspect-video",
};

export function ImageWithAnnotation({ imagePrompt, alt, size = "landscape_16_9", annotations = [] }: Props) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className={`relative overflow-hidden rounded-card bg-cream-200 ${aspectBySize[size]}`}>
      <img
        src={resolveImg(imagePrompt, size)}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover"
      />

      {annotations.map((a, i) => {
        const isOpen = active === i || annotations.length === 1;
        return (
          <div key={i} className="absolute" style={{ left: `${a.x}%`, top: `${a.y}%` }}>
            {/* dashed target ring */}
            <button
              onClick={() => setActive(isOpen ? null : i)}
              className="absolute -left-5 -top-5 h-10 w-10 rounded-full border-2 border-dashed border-miffy bg-miffy/10 transition hover:bg-miffy/20"
              style={{ animation: "floaty 4s ease-in-out infinite" }}
              aria-label={a.label}
            />
            {/* label */}
            <div
              className={`absolute left-6 top-6 z-10 max-w-[180px] origin-top-left rounded-2xl border border-wood/20 bg-cream-50/95 px-3 py-2 text-xs font-medium text-ink shadow-lift backdrop-blur transition ${
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-miffy" />
              {a.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
