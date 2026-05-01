import { NodeIconPreviewGlyph } from "./NodeIconPreviewGlyph";
import type { NodeIconPreviewEntry } from "./nodeIconCatalogueData";

interface NodeIconCardProps {
  entry: NodeIconPreviewEntry;
}

export function NodeIconCard({ entry }: NodeIconCardProps) {
  return (
    <article className="rounded border border-border/70 bg-card/80 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{entry.label}</h3>
          {entry.note ? (
            <p className="mt-1 text-[11px] font-mono uppercase tracking-wide text-muted-foreground/70">
              {entry.note}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex items-end gap-4">
        <IconScalePreview entry={entry} size={24} label="24" />
        <IconScalePreview entry={entry} size={32} label="32" />
      </div>
    </article>
  );
}

function IconScalePreview({
  entry,
  size,
  label,
}: {
  entry: NodeIconPreviewEntry;
  size: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded border border-border/60 bg-background/80 px-2 py-2">
        <NodeIconPreviewGlyph
          family={entry.family}
          badge={entry.badge}
          tone={entry.tone}
          selected={entry.selected}
          warningPip={entry.warningPip}
          size={size}
        />
      </div>
      <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground/60">
        {label}px
      </span>
    </div>
  );
}