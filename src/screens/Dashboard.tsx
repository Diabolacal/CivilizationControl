/**
 * Dashboard — Command Overview screen.
 *
 * Layout mirrors Figma guidance:
 *   1. Header with system-status pill
 *   2. 5-col metric grid (hero revenue col-span-2 + 3 supporting cards)
 *   3. Strategic Network topology panel
 *   4. Lower section: Recent Signals (2/3) + Attention Required (1/3)
 *   5. Spatial assignment panel
 *
 * Governance vocabulary: "Command Overview", "Gross Network Yield",
 * "Enforced Directives", "Telemetry Signals" per narrative spec.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import {
  Building2,
  Shield,
  Power,
  DollarSign,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { useConnection } from "@evefrontier/dapp-kit";
import { DashboardPanelFrame } from "@/components/dashboard/DashboardPanelFrame";
import { MetricCard } from "@/components/MetricCard";
import { PostureControl } from "@/components/PostureControl";
import { StructureActionContextMenu } from "@/components/structure-actions/StructureActionContextMenu";
import { StructureRenameDialog } from "@/components/structure-actions/StructureRenameDialog";
import { StrategicMapPanel } from "@/components/topology/StrategicMapPanel";
import { TopologyPanelFade, TopologyPanelFrame } from "@/components/topology/TopologyPanelFrame";
import { NodeDrilldownSurface } from "@/components/topology/node-drilldown/NodeDrilldownSurface";
import { NodePowerActionStrip } from "@/components/topology/node-drilldown/NodePowerActionStrip";
import { NodePowerCapacityDialog } from "@/components/topology/node-drilldown/NodePowerCapacityDialog";
import { NodePowerPresetDialog } from "@/components/topology/node-drilldown/NodePowerPresetDialog";
import { NodeSelectionInspector } from "@/components/topology/node-drilldown/NodeSelectionInspector";
import { NodeStructureListPanel } from "@/components/topology/node-drilldown/NodeStructureListPanel";
import { SignalEventRow } from "@/components/SignalEventRow";
import { TxFeedbackBanner } from "@/components/TxFeedbackBanner";
import { useSignalFeed } from "@/hooks/useSignalFeed";
import { useNodeAssemblies } from "@/hooks/useNodeAssemblies";
import { useCharacterId } from "@/hooks/useCharacter";
import { useNodeDrilldownHiddenState } from "@/hooks/useNodeDrilldownHiddenState";
import { useNodeDrilldownLayoutOverrides } from "@/hooks/useNodeDrilldownLayoutOverrides";
import { useNodeDrilldownStructureMenu } from "@/hooks/useNodeDrilldownStructureMenu";
import { useNodePowerPresets } from "@/hooks/useNodePowerPresets";
import { useOperatorInventory } from "@/hooks/useOperatorInventory";
import { useStructureSurfaceActions } from "@/hooks/useStructureSurfaceActions";
import { useStructurePower } from "@/hooks/useStructurePower";
import { useStructureRename } from "@/hooks/useStructureRename";
import { useStructureWriteReconciliation } from "@/hooks/useStructureWriteReconciliation";
import type { AssetDiscoveryDisplayDebugState } from "@/lib/assetDiscoveryDisplayModel";
import { formatLux, formatEve } from "@/lib/currency";
import { buildFuelPresentation, formatRuntimeSeconds } from "@/lib/fuelRuntime";
import { resolveNodeDrilldownScopeKey } from "@/lib/nodeDrilldownHiddenState";
import { buildNodeDrilldownMenuItems } from "@/lib/nodeDrilldownMenuItems";
import { buildLiveNodeLocalViewModelWithObserved, buildNodeDrilldownDebugSnapshot } from "@/lib/nodeDrilldownModel";
import {
  buildNodeChildBulkPowerPlan,
  buildNodePowerPresetApplyPlan,
  getNodePowerUsageReadout,
  inspectNodePowerPlanForFreshInventory,
  inspectNodePowerPlanForChainEligibility,
  toMixedAssemblyPowerTarget,
  type NodePowerOperationPlan,
} from "@/lib/nodePowerControlModel";
import {
  buildNodePowerOutcomeDetail,
  buildNodePowerOutcomePreviewItems,
  summarizeNodePowerBulkOutcome,
  type NodePowerBulkOutcomeSummary,
} from "@/lib/nodePowerBulkOutcomeModel";
import { fetchStructurePowerChainSnapshots } from "@/lib/structurePowerChainStatus";
import { buildOperatorInventoryDebugCopySummary, buildOperatorInventoryDebugSnapshot } from "@/lib/operatorInventoryDebug";
import type { NetworkMetrics, NetworkNodeGroup, SpatialPin, Structure, TxResult } from "@/types/domain";
import type { NodeLocalStructure } from "@/lib/nodeDrilldownTypes";

type VerifiedNodeLocalTarget = NonNullable<NodeLocalStructure["actionAuthority"]["verifiedTarget"]>;

type NodePowerFeedbackContext =
  | { kind: "bring-online" }
  | { kind: "take-offline" }
  | { kind: "preset"; presetLabel: string };

interface DashboardProps {
  nodeGroups: NetworkNodeGroup[];
  metrics: NetworkMetrics;
  pins: SpatialPin[];
  structures: Structure[];
  isLoading: boolean;
  isConnected: boolean;
  readModelDebug: AssetDiscoveryDisplayDebugState;
  homeRequestToken: number;
}

function buildNodePowerSubmittedMessage(
  context: NodePowerFeedbackContext,
  outcome: NodePowerBulkOutcomeSummary,
): string {
  if (outcome.heldCount > 0) {
    return context.kind === "preset"
      ? `${context.presetLabel} submitted. Some rows were held. Awaiting read-model sync.`
      : "Node child power action submitted. Some rows were held. Awaiting read-model sync.";
  }

  if (outcome.alreadyCorrectCount > 0) {
    return context.kind === "preset"
      ? `${context.presetLabel} submitted. Some rows already matched. Awaiting read-model sync.`
      : "Node child power action submitted. Some rows already matched. Awaiting read-model sync.";
  }

  switch (context.kind) {
    case "bring-online":
      return "Node child structures brought online. Awaiting read-model sync.";
    case "take-offline":
      return "Node child structures taken offline. Awaiting read-model sync.";
    case "preset":
      return `${context.presetLabel} applied. Awaiting read-model sync.`;
  }
}

function buildNodePowerLocalMessage(
  context: NodePowerFeedbackContext,
  outcome: NodePowerBulkOutcomeSummary,
): string {
  if (outcome.alreadyCorrectCount > 0 && outcome.heldCount === 0) {
    return "No child power changes needed. View updated.";
  }

  if (
    context.kind === "bring-online"
    && outcome.submittedCount === 0
    && outcome.alreadyCorrectCount === 0
    && outcome.heldCount > 0
    && outcome.heldEntries.every((entry) => entry.reason === "invalid_chain_status" || entry.reason === "chain_status_unavailable")
  ) {
    return "No child structures could be brought online from current chain status. View updated.";
  }

  return "No child power transaction submitted. View updated.";
}

function buildNodePowerFeedbackResult(
  context: NodePowerFeedbackContext,
  outcome: NodePowerBulkOutcomeSummary,
  mode: "submitted" | "local",
): Omit<TxResult, "digest"> {
  return {
    message: mode === "submitted"
      ? buildNodePowerSubmittedMessage(context, outcome)
      : buildNodePowerLocalMessage(context, outcome),
    detail: buildNodePowerOutcomeDetail(outcome) ?? undefined,
    items: buildNodePowerOutcomePreviewItems(outcome),
  };
}

export function Dashboard({
  nodeGroups,
  metrics,
  pins,
  structures,
  isLoading,
  isConnected,
  readModelDebug,
  homeRequestToken,
}: DashboardProps) {
  const { walletAddress } = useConnection();
  const operatorInventory = useOperatorInventory();
  const characterId = useCharacterId();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const selectedStructureCanonicalKeyRef = useRef<string | null>(null);
  const ownedObjectIds = useMemo(
    () => structures.map((s) => s.objectId),
    [structures],
  );
  const [postureTransitioning, setPostureTransitioning] = useState(false);
  const handlePostureTransitionChange = useCallback((t: boolean) => setPostureTransitioning(t), []);
  const PREVIEW_COUNT = 6;
  const TRANSITION_DURATION_MS = 520;
  const {
    signals: recentSignals,
    isError: isSignalFeedError,
    partial: isSignalFeedPartial,
    warnings: signalFeedWarnings,
  } = useSignalFeed({
    limit: 10,
    polling: false,
    ownedObjectIds,
    walletAddress: walletAddress ?? null,
    aggressiveRefetch: postureTransitioning,
  });
  const showSignalFeedLagHint = isSignalFeedPartial || signalFeedWarnings.length > 0;
  const revenueSignals = recentSignals.filter((s) => s.variant === "revenue");
  const totalRevenueBaseUnits = revenueSignals.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const totalRevenueLuxStr = formatLux(totalRevenueBaseUnits);
  const totalRevenueEveStr = formatEve(totalRevenueBaseUnits);
  const hasRevenue = totalRevenueBaseUnits > 0;
  const handleSelectNode = useCallback((nodeId: string) => setSelectedNodeId(nodeId), []);
  const selectedNodeGroup = useMemo(
    () => nodeGroups.find((group) => group.node.objectId === selectedNodeId) ?? null,
    [nodeGroups, selectedNodeId],
  );
  const selectedNodeInventoryLookup = useMemo(
    () => (selectedNodeGroup?.node.objectId
      ? operatorInventory.adapted?.nodeLookupsByNodeId.get(selectedNodeGroup.node.objectId) ?? null
      : null),
    [operatorInventory.adapted?.nodeLookupsByNodeId, selectedNodeGroup],
  );
  const shouldUseNodeAssembliesFallback = Boolean(
    selectedNodeGroup?.node.objectId
    && selectedNodeGroup.node.objectId !== "unassigned"
    && selectedNodeInventoryLookup == null
    && operatorInventory.isError,
  );
  const {
    lookup: selectedNodeAssembliesLookup,
    isLoading: isNodeAssembliesLoading,
    hasAttempted: hasAttemptedNodeAssembliesFallback,
    refetch: refetchSelectedNodeAssemblies,
  } = useNodeAssemblies(selectedNodeGroup?.node.objectId ?? null, {
    enabled: shouldUseNodeAssembliesFallback,
  });
  const { applyNodeAssembliesLookup, applyOperatorInventory, reconcileWrite } = useStructureWriteReconciliation();
  const selectedNodeObservedLookup = useMemo(
    () => applyNodeAssembliesLookup(selectedNodeInventoryLookup ?? selectedNodeAssembliesLookup),
    [applyNodeAssembliesLookup, selectedNodeAssembliesLookup, selectedNodeInventoryLookup],
  );
  const selectedNodeBuildOptions = useMemo(
    () => ({
      isLoading: selectedNodeInventoryLookup == null
        ? (shouldUseNodeAssembliesFallback ? isNodeAssembliesLoading : operatorInventory.isLoading)
        : false,
      preferObservedMembership: selectedNodeInventoryLookup != null,
    }),
    [isNodeAssembliesLoading, operatorInventory.isLoading, selectedNodeInventoryLookup, shouldUseNodeAssembliesFallback],
  );
  const structurePower = useStructurePower();
  const structureRename = useStructureRename();
  const nodeSurfaceActions = useStructureSurfaceActions();
  const [powerStructureId, setPowerStructureId] = useState<string | null>(null);
  const [powerSuccessLabel, setPowerSuccessLabel] = useState("Structure power state updated");
  const [isPowerPresetDialogOpen, setIsPowerPresetDialogOpen] = useState(false);
  const [pendingNodePowerPlan, setPendingNodePowerPlan] = useState<{
    body: string;
    feedbackContext: NodePowerFeedbackContext;
    plan: NodePowerOperationPlan;
    primaryLabel: string;
    successLabel: string;
    title: string;
  } | null>(null);
  const [renameSuccessLabel, setRenameSuccessLabel] = useState("Assembly renamed");
  const [renameTarget, setRenameTarget] = useState<{
    assemblyId: string | null;
    canonicalDomainKey: string;
    displayName: string;
    networkNodeId: string | null;
    ownerCapId: string;
    selectedNodeId: string | null;
    structureId: string;
    structureType: VerifiedNodeLocalTarget["structureType"];
  } | null>(null);
  const {
    contextMenu,
    menuRef,
    openStructureMenu,
    closeStructureMenu,
  } = useNodeDrilldownStructureMenu();
  const selectedNodeViewModel = useMemo(
    () => (selectedNodeGroup
      ? buildLiveNodeLocalViewModelWithObserved(selectedNodeGroup, selectedNodeObservedLookup, selectedNodeBuildOptions)
      : null),
    [selectedNodeBuildOptions, selectedNodeGroup, selectedNodeObservedLookup],
  );
  const nodeDrilldownScopeKey = useMemo(
    () => resolveNodeDrilldownScopeKey(characterId, walletAddress),
    [characterId, walletAddress],
  );
  const nodePowerPresets = useNodePowerPresets({
    nodeId: selectedNodeViewModel?.node.id ?? null,
    scopeKey: nodeDrilldownScopeKey,
    structures: selectedNodeViewModel?.structures ?? [],
  });
  const nodeLayoutOverrides = useNodeDrilldownLayoutOverrides({
    nodeId: selectedNodeViewModel?.node.id ?? null,
    scopeKey: nodeDrilldownScopeKey,
  });
  const nodePowerUsageReadout = useMemo(() => getNodePowerUsageReadout(), []);
  const {
    hiddenCanonicalKeySet,
    hiddenCount,
    visibleStructures,
    hideStructure,
    unhideStructure,
  } = useNodeDrilldownHiddenState({
    nodeId: selectedNodeViewModel?.node.id ?? null,
    scopeKey: nodeDrilldownScopeKey,
    structures: selectedNodeViewModel?.structures ?? [],
  });
  const visibleNodeViewModel = useMemo(
    () => (selectedNodeViewModel ? { ...selectedNodeViewModel, structures: visibleStructures } : null),
    [selectedNodeViewModel, visibleStructures],
  );
  const bringAllOnlinePlan = useMemo(
    () => buildNodeChildBulkPowerPlan(selectedNodeViewModel?.structures ?? [], true),
    [selectedNodeViewModel?.structures],
  );
  const takeAllOfflinePlan = useMemo(
    () => buildNodeChildBulkPowerPlan(selectedNodeViewModel?.structures ?? [], false),
    [selectedNodeViewModel?.structures],
  );
  const presetApplyPlans = useMemo(
    () => nodePowerPresets.slots.map((slot) => buildNodePowerPresetApplyPlan(slot, selectedNodeViewModel?.structures ?? [])),
    [nodePowerPresets.slots, selectedNodeViewModel?.structures],
  );
  const canSavePowerPreset = useMemo(
    () => (selectedNodeViewModel?.structures ?? []).some((structure) => structure.status === "online" || structure.status === "offline"),
    [selectedNodeViewModel?.structures],
  );
  const defaultPowerPresetSlotIndex = useMemo(() => {
    const emptyIndex = nodePowerPresets.slots.findIndex((slot) => slot == null);
    return emptyIndex >= 0 ? emptyIndex + 1 : 1;
  }, [nodePowerPresets.slots]);
  const selectedNodeStructureMap = useMemo(
    () => new Map((selectedNodeViewModel?.structures ?? []).map((structure) => [structure.id, structure])),
    [selectedNodeViewModel],
  );
  const contextMenuStructure = contextMenu ? selectedNodeStructureMap.get(contextMenu.structureId) ?? null : null;
  const handleSelectNodeLocalStructure = useCallback(
    (structureId: string | null) => {
      if (structureId == null) {
        selectedStructureCanonicalKeyRef.current = null;
        setSelectedStructureId(null);
        return;
      }

      const structure = selectedNodeStructureMap.get(structureId);
      if (structure) {
        selectedStructureCanonicalKeyRef.current = structure.canonicalDomainKey;
      }

      setSelectedStructureId(structureId);
    },
    [selectedNodeStructureMap, selectedStructureCanonicalKeyRef],
  );
  const handleOpenNodeLocalStructureMenu = useCallback(
    (params: Parameters<typeof openStructureMenu>[0]) => {
      nodeSurfaceActions.closeStructureContextMenu();
      selectedStructureCanonicalKeyRef.current = params.structure.canonicalDomainKey;
      setSelectedStructureId(params.structure.id);
      openStructureMenu(params);
    },
    [nodeSurfaceActions.closeStructureContextMenu, openStructureMenu, selectedStructureCanonicalKeyRef],
  );
  const handleCloseNodeControlMenus = useCallback(() => {
    closeStructureMenu();
    nodeSurfaceActions.closeStructureContextMenu();
  }, [closeStructureMenu, nodeSurfaceActions.closeStructureContextMenu]);
  const handleOpenSelectedNodeMenu = useCallback(
    ({ clientX, clientY }: { clientX: number; clientY: number }) => {
      if (!selectedNodeGroup) {
        return;
      }

      closeStructureMenu();
      selectedStructureCanonicalKeyRef.current = null;
      setSelectedStructureId(null);
      nodeSurfaceActions.openStructureContextMenu(
        selectedNodeGroup.node,
        clientX,
        clientY,
        { nodeOfflineLookup: selectedNodeObservedLookup },
      );
    },
    [closeStructureMenu, nodeSurfaceActions.openStructureContextMenu, selectedNodeGroup, selectedNodeObservedLookup, selectedStructureCanonicalKeyRef],
  );
  const handleExitNodeControl = useCallback(() => {
    handleCloseNodeControlMenus();
    selectedStructureCanonicalKeyRef.current = null;
    setSelectedStructureId(null);
    setSelectedNodeId(null);
  }, [handleCloseNodeControlMenus, selectedStructureCanonicalKeyRef]);
  const handleDismissNodeLocalPowerFeedback = useCallback(() => {
    structurePower.reset();
    setPowerStructureId(null);
  }, [structurePower]);
  const preflightNodePowerPlan = useCallback(async (plan: NodePowerOperationPlan) => {
    if (plan.disabledReason || plan.targets.length === 0) {
      return { ...plan, decisions: [] };
    }

    let inventoryForFinalFilter = operatorInventory.inventory;
    const freshInventoryResult = await operatorInventory.refetch().catch(() => null);
    if (freshInventoryResult?.data) {
      inventoryForFinalFilter = applyOperatorInventory(freshInventoryResult.data);
    }

    const inventoryEvaluation = inspectNodePowerPlanForFreshInventory(
      plan,
      inventoryForFinalFilter,
      selectedNodeGroup?.node.objectId ?? null,
    );

    if (inventoryEvaluation.targets.length === 0) {
      return inventoryEvaluation;
    }

    const chainSnapshots = inventoryEvaluation.targets.length > 0
      ? await fetchStructurePowerChainSnapshots(inventoryEvaluation.targets.map(toMixedAssemblyPowerTarget)).catch(() => null)
      : new Map();

    const chainEvaluation = inspectNodePowerPlanForChainEligibility(inventoryEvaluation, chainSnapshots);

    return {
      targets: chainEvaluation.targets,
      disabledReason: chainEvaluation.disabledReason,
      capacityReason: chainEvaluation.capacityReason,
      decisions: [...inventoryEvaluation.decisions, ...chainEvaluation.decisions],
    };
  }, [applyOperatorInventory, operatorInventory, selectedNodeGroup]);
  const executeNodePowerPlan = useCallback(async (
    plan: NodePowerOperationPlan,
    successLabel: string,
    feedbackContext: NodePowerFeedbackContext,
  ) => {
    if (plan.disabledReason || plan.targets.length === 0) return false;

    handleCloseNodeControlMenus();
    selectedStructureCanonicalKeyRef.current = null;
    setSelectedStructureId(null);
    setPowerStructureId(null);
    setPowerSuccessLabel(successLabel);

    const executionPlan = await preflightNodePowerPlan(plan);
    const outcome = summarizeNodePowerBulkOutcome(plan, executionPlan);
    const refreshOptions = {
      selectedNodeId: selectedNodeGroup?.node.objectId ?? null,
      refetchNodeAssemblies: selectedNodeInventoryLookup ? null : refetchSelectedNodeAssemblies,
      refetchSignalFeed: true,
      targets: outcome.submittedTargets,
    };

    if (outcome.correctionTargets.length > 0) {
      reconcileWrite({
        action: "power",
        digest: null,
        targets: outcome.correctionTargets,
        refreshOptions: {
          ...refreshOptions,
          targets: outcome.correctionTargets,
        },
      });
    }

    if (executionPlan.disabledReason || executionPlan.targets.length === 0) {
      return structurePower.reportLocalSuccess(buildNodePowerFeedbackResult(feedbackContext, outcome, "local"));
    }

    return structurePower.toggleMixed({
      targets: executionPlan.targets.map(toMixedAssemblyPowerTarget),
    }, refreshOptions, buildNodePowerFeedbackResult(feedbackContext, outcome, "submitted"));
  }, [handleCloseNodeControlMenus, preflightNodePowerPlan, reconcileWrite, refetchSelectedNodeAssemblies, selectedNodeGroup, selectedNodeInventoryLookup, selectedStructureCanonicalKeyRef, structurePower]);
  const requestNodePowerPlanExecution = useCallback((params: {
    feedbackContext: NodePowerFeedbackContext;
    plan: NodePowerOperationPlan;
    primaryLabel: string;
    successLabel: string;
    title: string;
  }) => {
    if (params.plan.disabledReason || params.plan.targets.length === 0) return;

    if (params.plan.capacityReason) {
      setPendingNodePowerPlan({
        ...params,
        body: "Power requirements are not available for this node. The transaction will not succeed if the node cannot support the requested load.",
      });
      return;
    }

    void executeNodePowerPlan(params.plan, params.successLabel, params.feedbackContext);
  }, [executeNodePowerPlan]);
  const handleBulkNodePower = useCallback((nextOnline: boolean) => {
    requestNodePowerPlanExecution({
      feedbackContext: nextOnline ? { kind: "bring-online" } : { kind: "take-offline" },
      plan: nextOnline ? bringAllOnlinePlan : takeAllOfflinePlan,
      primaryLabel: nextOnline ? "Bring all online" : "Take all offline",
      successLabel: nextOnline
        ? "Node child structures brought online. Awaiting read-model sync."
        : "Node child structures taken offline. Awaiting read-model sync.",
      title: nextOnline ? "Power requirement unavailable" : "Confirm child power action",
    });
  }, [bringAllOnlinePlan, requestNodePowerPlanExecution, takeAllOfflinePlan]);
  const handleApplyPowerPreset = useCallback((slotIndex: number) => {
    const plan = presetApplyPlans[slotIndex - 1];
    const slot = nodePowerPresets.slots[slotIndex - 1];
    if (!plan || !slot) return;

    requestNodePowerPlanExecution({
      feedbackContext: { kind: "preset", presetLabel: slot.label },
      plan,
      primaryLabel: "Apply preset",
      successLabel: `${slot.label} applied. Awaiting read-model sync.`,
      title: plan.capacityReason ? "Power requirement unavailable" : "Apply power preset",
    });
  }, [nodePowerPresets.slots, presetApplyPlans, requestNodePowerPlanExecution]);
  const handleSavePowerPreset = useCallback((slotIndex: number, label: string) => {
    nodePowerPresets.savePreset(slotIndex, label);
    setIsPowerPresetDialogOpen(false);
  }, [nodePowerPresets]);
  const handleConfirmPendingNodePowerPlan = useCallback(() => {
    if (!pendingNodePowerPlan) return;

    void executeNodePowerPlan(
      pendingNodePowerPlan.plan,
      pendingNodePowerPlan.successLabel,
      pendingNodePowerPlan.feedbackContext,
    ).then((succeeded) => {
      if (succeeded) {
        setPendingNodePowerPlan(null);
      }
    });
  }, [executeNodePowerPlan, pendingNodePowerPlan]);
  const handleToggleNodeLocalPower = useCallback(
    async (structure: NodeLocalStructure, nextOnline: boolean) => {
      const verifiedTarget = structure.actionAuthority.verifiedTarget;
      if (!verifiedTarget) return;

      const desiredStatus: "online" | "offline" = nextOnline ? "online" : "offline";
      const refreshTarget = {
        objectId: verifiedTarget.structureId,
        structureType: verifiedTarget.structureType,
        ownerCapId: verifiedTarget.ownerCapId,
        networkNodeId: verifiedTarget.networkNodeId,
        assemblyId: structure.assemblyId ?? null,
        canonicalDomainKey: structure.canonicalDomainKey,
        displayName: structure.displayName,
        desiredStatus,
      };

      closeStructureMenu();
      selectedStructureCanonicalKeyRef.current = structure.canonicalDomainKey;
      setSelectedStructureId(structure.id);
      setPowerStructureId(structure.id);
      setPowerSuccessLabel(`${structure.familyLabel} ${nextOnline ? "brought online" : "taken offline"}. Awaiting read-model sync.`);

      const preflightPlan = await preflightNodePowerPlan({
        targets: [{ desiredOnline: nextOnline, structure, verifiedTarget }],
        disabledReason: null,
        capacityReason: null,
      });
      const firstDecision = preflightPlan.decisions[0] ?? null;
      if (preflightPlan.disabledReason || preflightPlan.targets.length === 0) {
        if (nextOnline && firstDecision?.reason === "already_online") {
          return structurePower.applyLocalCorrection("online", {
            selectedNodeId: selectedNodeGroup?.node.objectId ?? null,
            refetchNodeAssemblies: selectedNodeInventoryLookup ? null : refetchSelectedNodeAssemblies,
            refetchSignalFeed: true,
            target: refreshTarget,
          }, "Already online. View updated.");
        }

        if (nextOnline && firstDecision?.reason === "invalid_chain_status") {
          return structurePower.reportLocalSuccess("Cannot bring online from current chain status.");
        }

        if (!nextOnline && firstDecision?.reason === "already_offline") {
          return structurePower.applyLocalCorrection("offline", {
            selectedNodeId: selectedNodeGroup?.node.objectId ?? null,
            refetchNodeAssemblies: selectedNodeInventoryLookup ? null : refetchSelectedNodeAssemblies,
            refetchSignalFeed: true,
            target: refreshTarget,
          }, "Already offline. View updated.");
        }

        return structurePower.reportLocalSuccess(
          preflightPlan.disabledReason ?? (nextOnline ? "No eligible structures to bring online." : "No eligible structures to take offline."),
        );
      }

      await structurePower.toggleSingle({
        structureType: verifiedTarget.structureType,
        structureId: verifiedTarget.structureId,
        ownerCapId: verifiedTarget.ownerCapId,
        networkNodeId: verifiedTarget.networkNodeId,
        online: nextOnline,
      }, {
        selectedNodeId: selectedNodeGroup?.node.objectId ?? null,
        refetchNodeAssemblies: selectedNodeInventoryLookup ? null : refetchSelectedNodeAssemblies,
        refetchSignalFeed: true,
        target: refreshTarget,
      });
    },
    [
      closeStructureMenu,
      preflightNodePowerPlan,
      refetchSelectedNodeAssemblies,
      selectedNodeGroup,
      selectedNodeInventoryLookup,
      selectedStructureCanonicalKeyRef,
      structurePower,
    ],
  );
  const handleOpenNodeLocalRename = useCallback((structure: NodeLocalStructure) => {
    const verifiedTarget = structure.actionAuthority.verifiedTarget;
    if (!verifiedTarget) {
      return;
    }

    structureRename.reset();
    setRenameSuccessLabel("Assembly renamed. Awaiting read-model sync.");
    setRenameTarget({
      assemblyId: structure.assemblyId ?? null,
      canonicalDomainKey: structure.canonicalDomainKey,
      displayName: structure.displayName,
      networkNodeId: verifiedTarget.networkNodeId,
      ownerCapId: verifiedTarget.ownerCapId,
      selectedNodeId: selectedNodeGroup?.node.objectId ?? null,
      structureId: verifiedTarget.structureId,
      structureType: verifiedTarget.structureType,
    });
  }, [selectedNodeGroup, structureRename]);
  const handleCloseNodeLocalRename = useCallback(() => {
    if (structureRename.status !== "pending") {
      setRenameTarget(null);
    }
  }, [structureRename.status]);
  const handleSubmitNodeLocalRename = useCallback(async (nextName: string) => {
    if (!renameTarget) {
      return false;
    }

    const succeeded = await structureRename.rename({
      structureType: renameTarget.structureType,
      structureId: renameTarget.structureId,
      ownerCapId: renameTarget.ownerCapId,
      name: nextName,
    }, {
      selectedNodeId: renameTarget.selectedNodeId,
      refetchNodeAssemblies: selectedNodeInventoryLookup ? null : refetchSelectedNodeAssemblies,
      refetchSignalFeed: false,
      target: {
        objectId: renameTarget.structureId,
        structureType: renameTarget.structureType,
        ownerCapId: renameTarget.ownerCapId,
        networkNodeId: renameTarget.networkNodeId,
        assemblyId: renameTarget.assemblyId,
        canonicalDomainKey: renameTarget.canonicalDomainKey,
        displayName: renameTarget.displayName,
      },
    });

    if (succeeded) {
      setRenameTarget(null);
    }

    return succeeded;
  }, [refetchSelectedNodeAssemblies, renameTarget, selectedNodeInventoryLookup, structureRename]);
  const handleDismissNodeLocalRenameFeedback = useCallback(() => {
    structureRename.reset();
  }, [structureRename]);
  const topologyModeKey = selectedNodeViewModel ? `node-${selectedNodeViewModel.node.id}` : "macro";
  const isNodeDrilldownDebugEnabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    const value = new URLSearchParams(window.location.search).get("debugNodeDrilldown");
    if (value == null) return false;
    return value !== "0" && value.toLowerCase() !== "false";
  }, []);
  const isOperatorInventoryDebugEnabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    const value = new URLSearchParams(window.location.search).get("debugOperatorInventory");
    if (value == null) return false;
    return value !== "0" && value.toLowerCase() !== "false";
  }, []);
  const topologyTitle = selectedNodeViewModel ? "Node Control" : "Strategic Network";
  const topologySubtitle = selectedNodeViewModel
    ? `${selectedNodeViewModel.node.displayName} • ${selectedNodeViewModel.sourceMode === "backend-membership"
      ? "Backend membership view"
      : selectedNodeViewModel.sourceMode === "loading"
        ? "Live fallback while backend membership loads"
        : selectedNodeViewModel.sourceMode === "error-fallback"
          ? "Live fallback after backend lookup error"
          : "Direct-chain fallback view"}`
    : "Infrastructure Posture & Topology Control";
  const topologyHeaderAction = selectedNodeViewModel ? (
    <NodePowerActionStrip
      slots={nodePowerPresets.slots}
      presetPlans={presetApplyPlans}
      bringOnlinePlan={bringAllOnlinePlan}
      takeOfflinePlan={takeAllOfflinePlan}
      isPending={structurePower.status === "pending"}
      canSavePreset={canSavePowerPreset}
      onApplyPreset={handleApplyPowerPreset}
      onSavePreset={() => setIsPowerPresetDialogOpen(true)}
      onBulkPower={handleBulkNodePower}
      onBack={handleExitNodeControl}
    />
  ) : (
    <div className="flex items-center justify-end">
      <PostureControl nodeGroups={nodeGroups} isConnected={isConnected} inline onTransitionChange={handlePostureTransitionChange} />
    </div>
  );

  useEffect(() => {
    setSelectedStructureId(null);
    handleCloseNodeControlMenus();
    selectedStructureCanonicalKeyRef.current = null;
  }, [handleCloseNodeControlMenus, selectedNodeId, selectedStructureCanonicalKeyRef]);

  useEffect(() => {
    if (homeRequestToken === 0) return;
    handleExitNodeControl();
  }, [handleExitNodeControl, homeRequestToken]);

  useEffect(() => {
    if (selectedNodeId != null && selectedNodeGroup == null) {
      handleCloseNodeControlMenus();
      selectedStructureCanonicalKeyRef.current = null;
      setSelectedStructureId(null);
      setSelectedNodeId(null);
    }
  }, [handleCloseNodeControlMenus, selectedNodeGroup, selectedNodeId, selectedStructureCanonicalKeyRef]);

  useEffect(() => {
    if (!selectedNodeViewModel || selectedStructureId == null) {
      return;
    }

    const currentStructure = selectedNodeViewModel.structures.find((structure) => structure.id === selectedStructureId);
    if (currentStructure) {
      selectedStructureCanonicalKeyRef.current = currentStructure.canonicalDomainKey;
      return;
    }

    const canonicalDomainKey = selectedStructureCanonicalKeyRef.current;
    if (!canonicalDomainKey) {
      setSelectedStructureId(null);
      return;
    }

    const rematchedStructure = selectedNodeViewModel.structures.find(
      (structure) => structure.canonicalDomainKey === canonicalDomainKey,
    );
    if (rematchedStructure) {
      setSelectedStructureId(rematchedStructure.id);
      return;
    }

    selectedStructureCanonicalKeyRef.current = null;
    setSelectedStructureId(null);
  }, [selectedNodeViewModel, selectedStructureId, selectedStructureCanonicalKeyRef]);

  useEffect(() => {
    if (selectedNodeViewModel == null) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
      ) {
        return;
      }
      handleExitNodeControl();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleExitNodeControl, selectedNodeViewModel]);

  useEffect(() => {
    if (!isNodeDrilldownDebugEnabled) {
      if (window.__CC_NODE_DRILLDOWN_DEBUG__) {
        window.__CC_NODE_DRILLDOWN_DEBUG__.clear();
      }
      return;
    }

    const controller = window.__CC_NODE_DRILLDOWN_DEBUG__ ?? {
      enabled: true,
      latest: null,
      clear: () => {
        if (!window.__CC_NODE_DRILLDOWN_DEBUG__) return;
        window.__CC_NODE_DRILLDOWN_DEBUG__.latest = null;
      },
    };

    controller.enabled = true;
    controller.latest = selectedNodeGroup
      ? buildNodeDrilldownDebugSnapshot(selectedNodeGroup, selectedNodeObservedLookup, selectedNodeBuildOptions)
      : null;
    window.__CC_NODE_DRILLDOWN_DEBUG__ = controller;

    if (selectedNodeGroup) {
      console.info("[node-drilldown-debug] window.__CC_NODE_DRILLDOWN_DEBUG__.latest updated");
    }
  }, [isNodeDrilldownDebugEnabled, selectedNodeBuildOptions, selectedNodeGroup, selectedNodeObservedLookup]);

  useEffect(() => {
    if (!isOperatorInventoryDebugEnabled) {
      if (window.__CC_OPERATOR_INVENTORY_DEBUG__) {
        window.__CC_OPERATOR_INVENTORY_DEBUG__.clear();
      }
      return;
    }

    const controller = window.__CC_OPERATOR_INVENTORY_DEBUG__ ?? {
      enabled: true,
      latest: null,
      clear: () => {
        if (!window.__CC_OPERATOR_INVENTORY_DEBUG__) return;
        window.__CC_OPERATOR_INVENTORY_DEBUG__.latest = null;
      },
      copySummary: () => null,
    };

    controller.enabled = true;
    controller.latest = buildOperatorInventoryDebugSnapshot({
      requestedWalletAddress: operatorInventory.walletAddress,
      inventory: operatorInventory.inventory,
      adapted: operatorInventory.adapted,
      displayStructures: structures,
      displayNodeGroups: nodeGroups,
      selectedNodeRows: selectedNodeViewModel?.structures ?? [],
      selectedNodeSourceMode: selectedNodeViewModel?.sourceMode ?? null,
      selectedNodeId: selectedNodeGroup?.node.objectId ?? null,
      readModelDebug,
      nodeAssembliesFallbackEnabled: shouldUseNodeAssembliesFallback,
      nodeAssembliesFallbackRan: shouldUseNodeAssembliesFallback && hasAttemptedNodeAssembliesFallback,
      operatorInventoryErrorMessage: operatorInventory.errorMessage,
    });
    controller.copySummary = () => {
      const summary = buildOperatorInventoryDebugCopySummary(controller.latest);
      if (!summary) {
        return null;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(JSON.stringify(summary, null, 2)).catch(() => undefined);
      }

      return summary;
    };
    window.__CC_OPERATOR_INVENTORY_DEBUG__ = controller;

    console.info("[operator-inventory-debug] window.__CC_OPERATOR_INVENTORY_DEBUG__.latest updated");
  }, [
    hasAttemptedNodeAssembliesFallback,
    isOperatorInventoryDebugEnabled,
    nodeGroups,
    operatorInventory.adapted,
    operatorInventory.errorMessage,
    operatorInventory.inventory,
    readModelDebug,
    selectedNodeGroup,
    selectedNodeViewModel,
    shouldUseNodeAssembliesFallback,
    structures,
  ]);

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
            Command Overview
          </h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide">
            Governed Infrastructure at a Glance
          </p>
        </div>

      </div>

      {/* Metric Cards — 5-column: hero revenue (span-2) + 3 supporting */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
        <div className="col-span-2">
          <MetricCard
            title="Gross Network Yield (24h)"
            value={hasRevenue ? totalRevenueLuxStr : "0"}
            variant="hero"
            unit="Lux"
            icon={<DollarSign className="w-4 h-4" />}
            secondaryLabel={hasRevenue ? `${totalRevenueEveStr} EVE • ${revenueSignals.length} revenue event${revenueSignals.length !== 1 ? "s" : ""}` : "Awaiting toll and trade events"}
          />
        </div>
        <MetricCard
          title="Active Structures"
          value={metrics.totalStructures}
          icon={<Building2 className="w-3.5 h-3.5" />}
          subtitle={`${metrics.gateCount} Gate${metrics.gateCount !== 1 ? "s" : ""} / ${metrics.governedGateCount} Governed / ${metrics.storageUnitCount} Storage${metrics.storageUnitCount !== 1 ? "s" : ""} / ${metrics.networkNodeCount} Node${metrics.networkNodeCount !== 1 ? "s" : ""}`}
        />
        <MetricCard
          title="Grid Status"
          value={`${metrics.onlineCount}/${metrics.totalStructures}`}
          icon={<Power className="w-3.5 h-3.5" />}
          subtitle={metrics.onlineCount === metrics.totalStructures ? "All operational" : `${metrics.totalStructures - metrics.onlineCount} structure${metrics.totalStructures - metrics.onlineCount !== 1 ? "s" : ""} offline`}
        />
        <MetricCard
          title="Enforced Directives"
          value={metrics.enforcedDirectives}
          icon={<Shield className="w-3.5 h-3.5" />}
          subtitle="Active policies"
        />
      </div>

      {/* Strategic Network — Topology + Posture Command (integrated) */}
      <div className="mt-5">
        <TopologyPanelFrame
          title={topologyTitle}
          subtitle={topologySubtitle}
          headerAction={topologyHeaderAction}
          headerActionClassName={selectedNodeViewModel ? "flex min-w-0 max-w-[78vw] justify-end" : "flex justify-end whitespace-nowrap"}
          bodyClassName="select-none"
        >
          <TopologyPanelFade contentKey={topologyModeKey} durationMs={TRANSITION_DURATION_MS}>
            {visibleNodeViewModel && selectedNodeViewModel ? (
              <NodeDrilldownSurface
                embedded
                viewModel={visibleNodeViewModel}
                selectedStructureId={selectedStructureId}
                onSelectStructure={handleSelectNodeLocalStructure}
                onOpenNodeMenu={handleOpenSelectedNodeMenu}
                onOpenStructureMenu={handleOpenNodeLocalStructureMenu}
                onCloseStructureMenu={handleCloseNodeControlMenus}
                totalStructureCount={selectedNodeViewModel.structures.length}
                hiddenStructureCount={hiddenCount}
                layoutOverrides={nodeLayoutOverrides.positions}
                powerUsageLabel={nodePowerUsageReadout.label}
                hasManualLayout={nodeLayoutOverrides.hasManualLayout}
                isStructureMenuOpen={contextMenu != null || nodeSurfaceActions.contextMenu != null}
                onResetLayout={nodeLayoutOverrides.resetLayout}
                onUpdateStructurePosition={nodeLayoutOverrides.setStructurePosition}
                title=""
                subtitle=""
              />
            ) : (
              <StrategicMapPanel
                embedded
                nodeGroups={nodeGroups}
                pins={pins}
                structures={structures}
                isConnected={isConnected}
                signals={recentSignals}
                onPostureTransitionChange={handlePostureTransitionChange}
                onSelectNode={handleSelectNode}
                selectedNodeId={selectedNodeId}
              />
            )}
          </TopologyPanelFade>
        </TopologyPanelFrame>
      </div>

      {/* Lower section: Recent Signals + Attention Required */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardPanelFrame
            title={selectedNodeViewModel ? `Attached Structures (${selectedNodeViewModel.structures.length})` : "Recent Signals"}
            subtitle={selectedNodeViewModel ? "Compact power controls plus local hide state" : "Signal Feed across governed infrastructure"}
            headerAction={selectedNodeViewModel ? undefined : (
              <Link
                to="/activity"
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                View Log →
              </Link>
            )}
          >
            <TopologyPanelFade contentKey={`lower-left-${topologyModeKey}`} durationMs={TRANSITION_DURATION_MS} className="h-auto">
              {selectedNodeViewModel ? (
                <NodeStructureListPanel
                  embedded
                  viewModel={selectedNodeViewModel}
                  selectedStructureId={selectedStructureId}
                  onSelectStructure={handleSelectNodeLocalStructure}
                  hiddenCanonicalKeySet={hiddenCanonicalKeySet}
                  onUnhideStructure={unhideStructure}
                  onOpenStructureMenu={handleOpenNodeLocalStructureMenu}
                  onCloseStructureMenu={handleCloseNodeControlMenus}
                  onTogglePower={handleToggleNodeLocalPower}
                  powerStatus={structurePower.status}
                  powerStructureId={powerStructureId}
                />
              ) : (
                <div className="max-h-[420px] overflow-y-auto divide-y divide-border/50">
                  {showSignalFeedLagHint ? (
                    <div className="px-4 py-2 text-[11px] text-muted-foreground/50">
                      Some recent signals may still be indexing.
                    </div>
                  ) : null}
                  {recentSignals.length > 0 ? (
                    recentSignals.slice(0, PREVIEW_COUNT).map((signal) => (
                      <SignalEventRow key={signal.id} signal={signal} />
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-muted-foreground/60">
                        {isSignalFeedError
                          ? "Signal Feed is temporarily unavailable"
                          : isConnected
                            ? "No signals for your governed infrastructure"
                            : "Connect wallet to view Signal Feed"}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/40">
                        {isSignalFeedError
                          ? "Recent signals return automatically once the feed responds again."
                          : isConnected
                            ? "Recent status, governance, trade, and transit signals appear here as they index."
                            : "Signal Feed appears here once your command wallet is connected."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TopologyPanelFade>
          </DashboardPanelFrame>
        </div>

        <div>
          <DashboardPanelFrame
            title={selectedNodeViewModel ? "Selection Inspector" : "Attention Required"}
            subtitle={selectedNodeViewModel ? "Action authority and node view state" : "Operational risks requiring review"}
          >
            <TopologyPanelFade contentKey={`lower-right-${topologyModeKey}`} durationMs={TRANSITION_DURATION_MS} className="h-auto">
              {selectedNodeViewModel ? (
                <NodeSelectionInspector
                  embedded
                  viewModel={selectedNodeViewModel}
                  selectedNode={selectedNodeGroup?.node ?? null}
                  selectedStructureId={selectedStructureId}
                  hiddenCanonicalKeySet={hiddenCanonicalKeySet}
                  onOpenNodeMenu={handleOpenSelectedNodeMenu}
                  onUnhideStructure={unhideStructure}
                  onTogglePower={handleToggleNodeLocalPower}
                  powerStatus={structurePower.status}
                  powerResult={structurePower.result}
                  powerError={structurePower.error}
                  powerStructureId={powerStructureId}
                  powerSuccessLabel={powerSuccessLabel}
                  onDismissPowerFeedback={handleDismissNodeLocalPowerFeedback}
                  debugOperatorInventoryEnabled={isOperatorInventoryDebugEnabled}
                />
              ) : (
                <div className="divide-y divide-border/50">
                  <AttentionAlerts metrics={metrics} structures={structures} />
                </div>
              )}
            </TopologyPanelFade>
          </DashboardPanelFrame>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground animate-pulse">
            Resolving chain state…
          </p>
        </div>
      )}

      {contextMenu ? (
        <StructureActionContextMenu
          menu={{
            structureName: contextMenu.structureName,
            left: contextMenu.left,
            top: contextMenu.top,
            items: buildNodeDrilldownMenuItems({
              contextMenu,
              structure: contextMenuStructure,
              isPowerPending: structurePower.status === "pending",
              isRenamePending: structureRename.status === "pending",
              onHideStructure: hideStructure,
              onUnhideStructure: unhideStructure,
              onTogglePower: handleToggleNodeLocalPower,
              onRenameStructure: handleOpenNodeLocalRename,
            }),
          }}
          menuRef={menuRef}
          onClose={closeStructureMenu}
        />
      ) : null}

      {nodeSurfaceActions.renderContextMenu}
      {nodeSurfaceActions.renderRenameDialog}
      {nodeSurfaceActions.renderPowerConfirmDialog}

      {(nodeSurfaceActions.power.status === "success" || nodeSurfaceActions.power.status === "error") && (
        <div className="mt-4">
          <TxFeedbackBanner
            status={nodeSurfaceActions.power.status}
            result={nodeSurfaceActions.power.result}
            error={nodeSurfaceActions.power.error}
            successLabel={nodeSurfaceActions.powerSuccessLabel}
            onDismiss={nodeSurfaceActions.dismissPowerFeedback}
          />
        </div>
      )}

      {(nodeSurfaceActions.rename.status === "success" || nodeSurfaceActions.rename.status === "error") && (
        <div className="mt-4">
          <TxFeedbackBanner
            status={nodeSurfaceActions.rename.status}
            result={nodeSurfaceActions.rename.result}
            error={nodeSurfaceActions.rename.error}
            successLabel={nodeSurfaceActions.renameSuccessLabel}
            onDismiss={nodeSurfaceActions.dismissRenameFeedback}
          />
        </div>
      )}

      {(powerStructureId == null && (structurePower.status === "success" || structurePower.status === "error")) ? (
        <div className="mt-4">
          <TxFeedbackBanner
            status={structurePower.status}
            result={structurePower.result}
            error={structurePower.error}
            successLabel={powerSuccessLabel}
            pendingLabel="Submitting node power action..."
            onDismiss={handleDismissNodeLocalPowerFeedback}
          />
        </div>
      ) : null}

      {(structureRename.status === "success" || structureRename.status === "error") && (
        <div className="mt-4">
          <TxFeedbackBanner
            status={structureRename.status}
            result={structureRename.result}
            error={structureRename.error}
            successLabel={renameSuccessLabel}
            onDismiss={handleDismissNodeLocalRenameFeedback}
          />
        </div>
      )}

      {renameTarget ? (
        <StructureRenameDialog
          isOpen
          structureName={renameTarget.displayName}
          initialValue={renameTarget.displayName}
          isPending={structureRename.status === "pending"}
          error={structureRename.error}
          onClose={handleCloseNodeLocalRename}
          onSubmit={(nextName) => {
            void handleSubmitNodeLocalRename(nextName);
          }}
        />
      ) : null}

      <NodePowerPresetDialog
        isOpen={isPowerPresetDialogOpen}
        slots={nodePowerPresets.slots}
        defaultSlotIndex={defaultPowerPresetSlotIndex}
        onClose={() => setIsPowerPresetDialogOpen(false)}
        onSave={handleSavePowerPreset}
      />

      <NodePowerCapacityDialog
        isOpen={pendingNodePowerPlan != null}
        title={pendingNodePowerPlan?.title ?? "Power requirement unavailable"}
        body={pendingNodePowerPlan?.body ?? "Power requirements are not available for this node."}
        primaryLabel={pendingNodePowerPlan?.primaryLabel ?? "Continue"}
        isPending={structurePower.status === "pending"}
        onCancel={() => {
          if (structurePower.status !== "pending") {
            setPendingNodePowerPlan(null);
          }
        }}
        onConfirm={handleConfirmPendingNodePowerPlan}
      />
    </div>
  );
}

/** Computed alerts from real data instead of static placeholders. */
function AttentionAlerts({ metrics, structures }: { metrics: NetworkMetrics; structures: Structure[] }) {
  const offlineCount = metrics.totalStructures - metrics.onlineCount;
  const noExtCount = structures.filter(
    (s) => (s.type === "gate" || s.type === "turret") && s.extensionStatus !== "authorized",
  ).length;

  const alerts: { icon: React.ReactNode; name: string; issue: string; severity: "critical" | "warning" | "info"; to?: string }[] = [];

  if (offlineCount > 0) {
    alerts.push({
      icon: <Power className="w-3.5 h-3.5" />,
      name: "Offline Structures",
      issue: `${offlineCount} structure${offlineCount !== 1 ? "s" : ""} offline`,
      severity: "critical",
    });
  }

  if (noExtCount > 0) {
    alerts.push({
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      name: "Extension Gaps",
      issue: `${noExtCount} structure${noExtCount !== 1 ? "s" : ""} without authorized extension`,
      severity: "warning",
      to: "/gates",
    });
  }

  const nodeFuelStates = structures
    .filter((structure) => structure.type === "network_node")
    .map((structure) => ({ structure, fuel: buildFuelPresentation(structure) }));
  const criticalFuelNodes = nodeFuelStates.filter((entry) => entry.fuel.severity === "critical");
  const lowFuelNodes = nodeFuelStates.filter((entry) => entry.fuel.severity === "low");

  const shortestRuntimeLabel = (entries: typeof nodeFuelStates) => {
    const shortestRuntime = entries.reduce<number | null>((shortest, entry) => {
      const runtime = entry.fuel.estimatedSecondsRemaining;
      if (runtime == null) {
        return shortest;
      }

      return shortest == null || runtime < shortest ? runtime : shortest;
    }, null);

    return shortestRuntime != null ? formatRuntimeSeconds(shortestRuntime) : null;
  };

  if (criticalFuelNodes.length > 0) {
    alerts.push({
      icon: <Flame className="w-3.5 h-3.5" />,
      name: "Critical Fuel",
      issue: `${criticalFuelNodes.length} node${criticalFuelNodes.length !== 1 ? "s" : ""} under 1h${shortestRuntimeLabel(criticalFuelNodes) ? ` — shortest ${shortestRuntimeLabel(criticalFuelNodes)}` : ""}`,
      severity: "critical",
      to: "/nodes",
    });
  }

  if (lowFuelNodes.length > 0) {
    alerts.push({
      icon: <Flame className="w-3.5 h-3.5" />,
      name: "Low Fuel",
      issue: `${lowFuelNodes.length} node${lowFuelNodes.length !== 1 ? "s" : ""} under 24h${shortestRuntimeLabel(lowFuelNodes) ? ` — shortest ${shortestRuntimeLabel(lowFuelNodes)}` : ""}`,
      severity: "warning",
      to: "/nodes",
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="px-4 py-4 text-center">
        <p className="text-sm text-muted-foreground/60">All clear</p>
        <p className="text-[11px] text-muted-foreground/40 mt-1">No issues detected</p>
      </div>
    );
  }

  return (
    <>
      {alerts.map((a) => {
        const severityColor = {
          critical: "text-destructive",
          warning: "text-primary",
          info: "text-muted-foreground",
        }[a.severity];

        const content = (
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors group">
            <div className={`${severityColor} shrink-0`}>{a.icon}</div>
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {a.name}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {a.issue}
            </span>
          </div>
        );

        return a.to ? (
          <Link key={a.name} to={a.to}>{content}</Link>
        ) : (
          <div key={a.name}>{content}</div>
        );
      })}
    </>
  );
}
