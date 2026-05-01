import { NodeIconCard } from "./NodeIconCard";
import type { NodeIconPreviewEntry } from "./nodeIconCatalogueData";

interface NodeIconCatalogueSectionProps {
  title: string;
  subtitle: string;
  entries: NodeIconPreviewEntry[];
}

export function NodeIconCatalogueSection({
  title,
  subtitle,
  entries,
}: NodeIconCatalogueSectionProps) {
  return (
    <section className="rounded border border-border/70 bg-card/80 p-4">
      <div className="border-b border-border/50 pb-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-[11px] font-mono uppercase tracking-wide text-muted-foreground/70">
          {subtitle}
        </p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <NodeIconCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}