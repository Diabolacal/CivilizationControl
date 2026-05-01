import { NodeIconCatalogueSection } from "@/components/topology/node-icon-catalogue/NodeIconCatalogueSection";
import { NodeIconLegend } from "@/components/topology/node-icon-catalogue/NodeIconLegend";
import {
  DEFERRED_NODE_ICON_NOTES,
  FIRST_WAVE_NODE_ICONS,
  PROVISIONAL_NODE_ICONS,
} from "@/components/topology/node-icon-catalogue/nodeIconCatalogueData";

export function NodeIconCatalogueScreen() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-[1480px] px-6 py-8 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground/70">
              Reference Route // Node Icon Catalogue
            </p>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-foreground">
              Node Icon Reference
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Reference surface for node-level icon geometry, badge placement, and topology color grammar.
            </p>
          </div>
          <a
            href="/"
            className="rounded border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            Back to app
          </a>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <NodeIconLegend />
          <div className="space-y-6">
            <NodeIconCatalogueSection
              title="Macro Families"
              subtitle="Current strategic-map silhouettes remain unchanged"
              entries={FIRST_WAVE_NODE_ICONS}
            />
            <NodeIconCatalogueSection
              title="Node-Level Catalogue"
              subtitle="Reference catalogue for node-level structure families; Nursery and Nest remain provisional"
              entries={PROVISIONAL_NODE_ICONS}
            />

            <section className="rounded border border-border/70 bg-card/80 p-4">
              <div className="border-b border-border/50 pb-3">
                <h2 className="text-base font-semibold text-foreground">Deferred notes</h2>
                <p className="mt-1 text-[11px] font-mono uppercase tracking-wide text-muted-foreground/70">
                  Reserved labels for later icon work
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {DEFERRED_NODE_ICON_NOTES.map((label) => (
                  <span
                    key={label}
                    className="rounded border border-border/70 bg-background/80 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wide text-muted-foreground/80"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[11px] font-mono uppercase tracking-wide text-muted-foreground/60">
                Smart Turret 84556 remains unresolved and intentionally reuses standard turret grammar here.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}