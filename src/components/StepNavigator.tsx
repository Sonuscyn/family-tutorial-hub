import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { Step } from "../types";

interface StepNavigatorProps {
  steps: Step[];
  current: number;
  learned: boolean[];
  onSelect: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function StepNavigator({ steps, current, learned, onSelect, onPrev, onNext }: StepNavigatorProps) {
  const progress = Math.round((learned.filter(Boolean).length / steps.length) * 100);

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-ink">步骤进度</span>
        <span className="text-ink-soft">{learned.filter(Boolean).length}/{steps.length} 已学会</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-cream-200">
        <div
          className="h-full rounded-full bg-miffy transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {steps.map((s, i) => {
          const isCurrent = i === current;
          const isLearned = learned[i];
          return (
            <button
              key={s.id}
              onClick={() => onSelect(i)}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium transition ${
                isCurrent
                  ? "bg-miffy text-white shadow-soft"
                  : isLearned
                  ? "bg-miffy-soft text-miffy-dark"
                  : "bg-cream-200 text-ink-soft hover:bg-cream-200/70"
              }`}
              title={s.title}
            >
              {isLearned && !isCurrent ? <Check className="h-4 w-4" /> : i + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={current === 0}
          className="btn-ghost disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> 上一步
        </button>
        <span className="text-sm text-ink-soft">
          第 {current + 1} 步 · 共 {steps.length} 步
        </span>
        <button
          onClick={onNext}
          disabled={current === steps.length - 1}
          className="btn-ghost disabled:opacity-40"
        >
          下一步 <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
