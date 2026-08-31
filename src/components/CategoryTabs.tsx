import { categories } from "../data/tutorials";

interface CategoryTabsProps {
  active: string;
  onChange: (c: string) => void;
}

export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`shrink-0 px-4 py-2 text-sm transition ${
            active === c ? "chip-active" : "chip-outline"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
