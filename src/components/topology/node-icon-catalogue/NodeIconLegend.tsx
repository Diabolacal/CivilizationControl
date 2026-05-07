import { ExternalLink, FileText, Package } from "lucide-react";

import { NodeIconPreviewGlyph } from "./NodeIconPreviewGlyph";
import {
  NODE_ICON_COLOR_REFERENCE,
  STATE_EXAMPLE_ICONS,
} from "./nodeIconCatalogueData";

const GITHUB_SPEC_BRANCH = "docs/public-node-icon-pack-spec";
const GITHUB_SPEC_PATH = "docs/public/civilizationcontrol-icon-pack-spec.md";
const PRODUCTION_HOSTS = new Set([
  "civilizationcontrol.com",
  "www.civilizationcontrol.com",
  "civilizationcontrol.pages.dev",
]);

function getGithubSpecUrl() {
  const hostname = typeof window === "undefined" ? "" : window.location.hostname;
  const branch = PRODUCTION_HOSTS.has(hostname) ? "master" : GITHUB_SPEC_BRANCH;

  return `https://github.com/Diabolacal/CivilizationControl/blob/${encodeURIComponent(branch)}/${GITHUB_SPEC_PATH}`;
}

export function NodeIconLegend() {
  return (
    <aside className="space-y-4 rounded border border-border/70 bg-card/80 p-4">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground/70">
          Reference Key
        </p>
        <h2 className="mt-2 text-sm font-semibold text-foreground">State, size, and color grammar</h2>
      </div>

      <div className="rounded border border-border/60 bg-background/80 p-3">
        <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground/60">
          Icon Pack
        </p>
        <div className="mt-3 grid gap-2">
          <IconPackLink href="/downloads/civilizationcontrol-icon-pack.zip" label="Download SVG icon pack" icon="package" download />
          <IconPackLink href="/downloads/civilizationcontrol-icon-pack-spec.md" label="Download spec" icon="file" download />
          <IconPackLink href={getGithubSpecUrl()} label="View spec on GitHub" icon="external" external />
        </div>
      </div>

      <div className="rounded border border-border/60 bg-background/80 p-3">
        <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground/60">
          Size badges
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          M/H size badges anchor top-right on structure glyphs. Status pips use their own corners and do not move the size badge.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <LegendBadgeExample label="Standard" />
          <LegendBadgeExample label="Mini" badge="M" />
          <LegendBadgeExample label="Heavy" badge="H" />
        </div>
      </div>

      <div className="rounded border border-border/60 bg-background/80 p-3">
        <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground/60">
          State examples
        </p>
        <div className="mt-3 grid gap-3">
          {STATE_EXAMPLE_ICONS.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3">
              <NodeIconPreviewGlyph
                family={entry.family}
                badge={entry.badge}
                tone={entry.tone}
                selected={entry.selected}
                warningPip={entry.warningPip}
                size={24}
              />
              <span className="text-sm text-foreground">{entry.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded border border-border/60 bg-background/80 p-3">
        <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground/60">
          Color reference
        </p>
        <div className="mt-3 grid gap-2">
          {NODE_ICON_COLOR_REFERENCE.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 rounded border border-border/50 px-2.5 py-2">
              <span
                className="h-3.5 w-3.5 rounded-full border border-white/10"
                style={{ backgroundColor: entry.swatch }}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{entry.label}</p>
                <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground/70">
                  {entry.token} // {entry.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function IconPackLink({
  href,
  label,
  icon,
  external = false,
  download = false,
}: {
  href: string;
  label: string;
  icon: "external" | "file" | "package";
  external?: boolean;
  download?: boolean;
}) {
  const Icon = icon === "external" ? ExternalLink : icon === "file" ? FileText : Package;

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      download={download ? true : undefined}
      className="inline-flex min-h-9 items-center gap-2 rounded border border-border/60 bg-card/60 px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/45 hover:text-primary"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </a>
  );
}

function LegendBadgeExample({
  label,
  badge,
}: {
  label: string;
  badge?: "M" | "H";
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="rounded border border-border/60 bg-card/80 px-2 py-2">
        <NodeIconPreviewGlyph family="tradePost" badge={badge ?? null} size={24} />
      </div>
      <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground/70">
        {label}
      </span>
    </div>
  );
}
