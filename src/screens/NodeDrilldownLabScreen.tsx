import { useEffect, useMemo, useState } from "react";

import { StructureActionContextMenu } from "@/components/structure-actions/StructureActionContextMenu";
import { StructureRenameDialog } from "@/components/structure-actions/StructureRenameDialog";
import { NodeDrilldownSurface } from "@/components/topology/node-drilldown/NodeDrilldownSurface";
import { NodeSelectionInspector } from "@/components/topology/node-drilldown/NodeSelectionInspector";
import { NodeStructureListPanel } from "@/components/topology/node-drilldown/NodeStructureListPanel";
import { useNodeDrilldownHiddenState } from "@/hooks/useNodeDrilldownHiddenState";
import { useNodeDrilldownStructureMenu } from "@/hooks/useNodeDrilldownStructureMenu";
import { useStructureActionMenu } from "@/hooks/useStructureActionMenu";
import { buildNodeDrilldownMenuItems } from "@/lib/nodeDrilldownMenuItems";
import { NODE_DRILLDOWN_SCENARIOS } from "@/lib/nodeDrilldownScenarios";
import { cn } from "@/lib/utils";

import type { NodeLocalStructure, NodeLocalViewModel } from "@/lib/nodeDrilldownTypes";

function cloneScenarioViewModel(viewModel: NodeLocalViewModel): NodeLocalViewModel {
  return {
    ...viewModel,
    node: { ...viewModel.node },
    structures: viewModel.structures.map((structure) => ({
      ...structure,
      actionAuthority: {
        ...structure.actionAuthority,
        verifiedTarget: structure.actionAuthority.verifiedTarget
          ? { ...structure.actionAuthority.verifiedTarget }
          : null,
        candidateTargets: structure.actionAuthority.candidateTargets.map((candidate) => ({ ...candidate })),
      },
    })),
  };
}

export function NodeDrilldownLabScreen() {
  const [scenarioId, setScenarioId] = useState(NODE_DRILLDOWN_SCENARIOS[0]?.id ?? "");
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [isNodeRenameOpen, setIsNodeRenameOpen] = useState(false);

  const scenario = useMemo(
    () => NODE_DRILLDOWN_SCENARIOS.find((entry) => entry.id === scenarioId) ?? NODE_DRILLDOWN_SCENARIOS[0],
    [scenarioId],
  );
  const [scenarioViewModel, setScenarioViewModel] = useState<NodeLocalViewModel | null>(
    scenario ? cloneScenarioViewModel(scenario.viewModel) : null,
  );
  const {
    hiddenCanonicalKeySet,
    hiddenCount,
    visibleStructures,
    hideStructure,
    unhideStructure,
  } = useNodeDrilldownHiddenState({
    nodeId: scenarioViewModel?.node.id ?? null,
    scopeKey: null,
    structures: scenarioViewModel?.structures ?? [],
  });
  const visibleViewModel = useMemo(
    () => (scenarioViewModel ? { ...scenarioViewModel, structures: visibleStructures } : null),
    [scenarioViewModel, visibleStructures],
  );
  const {
    contextMenu,
    menuRef,
    openStructureMenu,
    closeStructureMenu,
  } = useNodeDrilldownStructureMenu();
  const nodeActionMenu = useStructureActionMenu();
  const scenarioStructureMap = useMemo(
    () => new Map((scenarioViewModel?.structures ?? []).map((structure) => [structure.id, structure])),
    [scenarioViewModel],
  );
  const renameTarget = renameTargetId ? scenarioStructureMap.get(renameTargetId) ?? null : null;

  const handlePreviewTogglePower = (structure: NodeLocalStructure, nextOnline: boolean) => {
    setSelectedStructureId(structure.id);
    setScenarioViewModel((current) => {
      if (!current) return current;

      return {
        ...current,
        structures: current.structures.map((entry) => {
          if (entry.id !== structure.id) return entry;

          const nextStatus = nextOnline ? "online" : "offline";
          return {
            ...entry,
            status: nextStatus,
            tone: nextOnline ? "online" : "offline",
            warningPip: false,
            actionAuthority: {
              ...entry.actionAuthority,
              verifiedTarget: entry.actionAuthority.verifiedTarget
                ? { ...entry.actionAuthority.verifiedTarget, status: nextStatus }
                : null,
              candidateTargets: entry.actionAuthority.candidateTargets.map((candidate) => (
                candidate.structureId === entry.actionAuthority.verifiedTarget?.structureId
                  ? { ...candidate, status: nextStatus }
                  : candidate
              )),
            },
          };
        }),
      };
    });
  };
  const handlePreviewNodePower = (nextOnline: boolean) => {
    setSelectedStructureId(null);
    setScenarioViewModel((current) => {
      if (!current) return current;

      const nextStatus = nextOnline ? "online" : "offline";
      return {
        ...current,
        node: {
          ...current.node,
          status: nextStatus,
          tone: nextStatus,
          warningPip: nextOnline ? current.node.warningPip : false,
        },
        structures: nextOnline ? current.structures : current.structures.map((entry) => ({
          ...entry,
          status: "offline",
          tone: "offline",
          warningPip: false,
          actionAuthority: {
            ...entry.actionAuthority,
            verifiedTarget: entry.actionAuthority.verifiedTarget
              ? { ...entry.actionAuthority.verifiedTarget, status: "offline" }
              : null,
            candidateTargets: entry.actionAuthority.candidateTargets.map((candidate) => ({
              ...candidate,
              status: "offline",
            })),
          },
        })),
      };
    });
  };
  const handlePreviewRename = (structure: NodeLocalStructure, nextName: string) => {
    setScenarioViewModel((current) => {
      if (!current) return current;

      return {
        ...current,
        structures: current.structures.map((entry) => (
          entry.id === structure.id
            ? { ...entry, displayName: nextName }
            : entry
        )),
      };
    });
    setRenameTargetId(null);
  };
  const handlePreviewNodeRename = (nextName: string) => {
    setScenarioViewModel((current) => current ? {
      ...current,
      node: { ...current.node, displayName: nextName },
    } : current);
    setIsNodeRenameOpen(false);
  };
  const handleOpenNodeMenu = ({ clientX, clientY }: { clientX: number; clientY: number }) => {
    if (!scenarioViewModel) {
      return;
    }

    closeStructureMenu();
    setSelectedStructureId(null);
    const isOnline = scenarioViewModel.node.status === "online";
    nodeActionMenu.openStructureActionMenu({
      structureId: scenarioViewModel.node.id,
      structureName: scenarioViewModel.node.displayName,
      clientX,
      clientY,
      items: [
        {
          key: isOnline ? "take-offline" : "bring-online",
          label: isOnline ? "Take offline" : "Bring online",
          tone: isOnline ? "offline" : "online",
          onSelect: () => handlePreviewNodePower(!isOnline),
        },
        {
          key: "rename-node",
          label: "Rename Node",
          onSelect: () => setIsNodeRenameOpen(true),
        },
      ],
    });
  };

  useEffect(() => {
    setSelectedStructureId(null);
    closeStructureMenu();
    nodeActionMenu.closeStructureActionMenu();
    setIsNodeRenameOpen(false);
  }, [closeStructureMenu, nodeActionMenu.closeStructureActionMenu, scenarioId]);

  useEffect(() => {
    if (!scenario) {
      setScenarioViewModel(null);
      return;
    }

    setScenarioViewModel(cloneScenarioViewModel(scenario.viewModel));
  }, [scenario]);

  useEffect(() => {
    if (!scenario?.initialHiddenCanonicalKeys?.length) return;
    scenario.initialHiddenCanonicalKeys.forEach((canonicalKey) => hideStructure(canonicalKey));
  }, [hideStructure, scenario]);

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

        {visibleViewModel ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded border border-border/60 px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground/75">
              {visibleViewModel.structures.length} visible
            </span>
            <span className="rounded border border-border/60 px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground/75">
              {scenarioViewModel?.structures.length ?? 0} attached
            </span>
            {hiddenCount > 0 ? (
              <span className="rounded border border-border/60 bg-muted/10 px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground/75">
                {hiddenCount} hidden from map
              </span>
            ) : null}
            <span className="rounded border border-border/60 px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground/75">
              Session-scoped persistence
            </span>
          </div>
        ) : null}

        <div className="mt-6">
          {visibleViewModel ? (
            <NodeDrilldownSurface
              viewModel={visibleViewModel}
              selectedStructureId={selectedStructureId}
              onSelectStructure={setSelectedStructureId}
              onOpenNodeMenu={handleOpenNodeMenu}
              onOpenStructureMenu={(params) => {
                nodeActionMenu.closeStructureActionMenu();
                setSelectedStructureId(params.structure.id);
                openStructureMenu(params);
              }}
              onCloseStructureMenu={closeStructureMenu}
              totalStructureCount={scenarioViewModel?.structures.length ?? 0}
              hiddenStructureCount={hiddenCount}
              isStructureMenuOpen={contextMenu != null || nodeActionMenu.contextMenu != null}
              title="Node Drilldown Lab"
              subtitle={scenario.description}
              headerAction={
                <span className="rounded border border-primary/40 bg-primary/8 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wide text-primary/90">
                  Synthetic / Dev-only
                </span>
              }
            />
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <NodeStructureListPanel
              viewModel={scenarioViewModel ?? scenario.viewModel}
              selectedStructureId={selectedStructureId}
              onSelectStructure={setSelectedStructureId}
              hiddenCanonicalKeySet={hiddenCanonicalKeySet}
              onUnhideStructure={unhideStructure}
              onOpenStructureMenu={(params) => {
                nodeActionMenu.closeStructureActionMenu();
                setSelectedStructureId(params.structure.id);
                openStructureMenu(params);
              }}
              onCloseStructureMenu={closeStructureMenu}
              onTogglePower={handlePreviewTogglePower}
              powerStructureId={selectedStructureId}
              previewMode
            />
          </div>
          <div>
            <NodeSelectionInspector
              viewModel={scenarioViewModel ?? scenario.viewModel}
              selectedStructureId={selectedStructureId}
              hiddenCanonicalKeySet={hiddenCanonicalKeySet}
              onOpenNodeMenu={handleOpenNodeMenu}
              onUnhideStructure={unhideStructure}
              onTogglePower={handlePreviewTogglePower}
              previewMode
            />
          </div>
        </div>

        {contextMenu ? (
          <StructureActionContextMenu
            menu={{
              structureName: contextMenu.structureName,
              left: contextMenu.left,
              top: contextMenu.top,
              items: buildNodeDrilldownMenuItems({
                contextMenu,
                structure: scenarioStructureMap.get(contextMenu.structureId) ?? null,
                onHideStructure: hideStructure,
                onUnhideStructure: unhideStructure,
                onTogglePower: handlePreviewTogglePower,
                onRenameStructure: (structure) => setRenameTargetId(structure.id),
              }),
            }}
            menuRef={menuRef}
            onClose={closeStructureMenu}
          />
        ) : null}

        {nodeActionMenu.contextMenu ? (
          <StructureActionContextMenu
            menu={nodeActionMenu.contextMenu}
            menuRef={nodeActionMenu.menuRef}
            onClose={nodeActionMenu.closeStructureActionMenu}
          />
        ) : null}

        {renameTarget ? (
          <StructureRenameDialog
            isOpen
            structureName={renameTarget.displayName}
            initialValue={renameTarget.displayName}
            onClose={() => setRenameTargetId(null)}
            onSubmit={(nextName) => handlePreviewRename(renameTarget, nextName)}
          />
        ) : null}

        {isNodeRenameOpen && scenarioViewModel ? (
          <StructureRenameDialog
            isOpen
            structureName={scenarioViewModel.node.displayName}
            initialValue={scenarioViewModel.node.displayName}
            title="Rename Node"
            fieldLabel="Node Name"
            submitLabel="Rename Node"
            onClose={() => setIsNodeRenameOpen(false)}
            onSubmit={handlePreviewNodeRename}
          />
        ) : null}
      </main>
    </div>
  );
}