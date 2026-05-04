import { SIGNAL_CATEGORIES } from "@/lib/eventParser";
import { cn } from "@/lib/utils";
import type { SignalCategory } from "@/types/domain";

interface SignalFeedCategoryBarProps {
  selectedCategory: SignalCategory | "all";
  onSelectCategory: (category: SignalCategory | "all") => void;
  disabled?: boolean;
}

export function SignalFeedCategoryBar({
  selectedCategory,
  onSelectCategory,
  disabled = false,
}: SignalFeedCategoryBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SIGNAL_CATEGORIES.map((category) => {
        const isSelected = selectedCategory === category.value;

        return (
          <button
            key={category.value}
            type="button"
            disabled={disabled}
            onClick={() => onSelectCategory(category.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              "disabled:cursor-not-allowed disabled:border-border/50 disabled:text-muted-foreground/40",
              isSelected
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}