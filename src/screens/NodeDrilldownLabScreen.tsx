import { useEffect, useMemo, useState } from "react";

import { NodeDrilldownSurface } from "@/components/topology/node-drilldown/NodeDrilldownSurface";
import { NodeSelectionInspector } from "@/components/topology/node-drilldown/NodeSelectionInspector";
import { NodeStructureListPanel } from "@/components/topology/node-drilldown/NodeStructureListPanel";
import { NODE_DRILLDOWN_SCENARIOS } from "@/lib/nodeDrilldownScenarios";
import { cn } from "@/lib/utils";

export function NodeDrilldownLabScreen() {
  const [scenarioId, setScenarioId] = useState(NODE_DRILLDOWN_SCENARIOS[0]?.id ?? "");
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);

  const scenario = useMemo(
    () => NODE_DRILLDOWN_SCENARIOS.find((entry) => entry.id === scenarioId) ?? NODE_DRILLDOWN_SCENARIOS[0],
    [scenarioId],
  );

  useEffect(() => {
    setSelectedStructureId(null);
  }, [scenarioId]);

  if (!scenario) return null;

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-[1760px] px-6 py-8 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground/70">
              Dev-only // Synthetic Node Drilldown Lab
            </p>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-foreground">
              Node Drilldown Lab
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Synthetic validation surface for dense node-local layouts. This route is isolated from wallet, Sui RPC, shared-backend, sponsor, and transaction flows.
            </p>
          </div>
          <a
            href="/"
            className="rounded border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            Back to app
          </a>
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          {NODE_DRILLDOWN_SCENARIOS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setScenarioId(entry.id)}
              className={cn(
                "rounded border px-3 py-1.5 text-xs font-medium transition-colors",
                entry.id === scenario.id
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <NodeDrilldownSurface
            viewModel={scenario.viewModel}
            selectedStructureId={selectedStructureId}
            onSelectStructure={setSelectedStructureId}
            title="Node Drilldown Lab"
            subtitle={scenario.description}
            headerAction={
              <span className="rounded border border-primary/40 bg-primary/8 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wide text-primary/90">
                Synthetic / Dev-only
              </span>
            }
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <NodeStructureListPanel
              viewModel={scenario.viewModel}
              selectedStructureId={selectedStructureId}
              onSelectStructure={setSelectedStructureId}
            />
          </div>
          <div>
            <NodeSelectionInspector
              viewModel={scenario.viewModel}
              selectedStructureId={selectedStructureId}
            />
          </div>
        </div>
      </main>
    </div>
  );
}