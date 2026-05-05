import { useCallback, useState } from "react";

import { StructureActionContextMenu } from "@/components/structure-actions/StructureActionContextMenu";
import { StructurePowerConfirmDialog } from "@/components/structure-actions/StructurePowerConfirmDialog";
import { StructureRenameDialog } from "@/components/structure-actions/StructureRenameDialog";
import type { NodeAssembliesLookupResult } from "@/lib/nodeAssembliesClient";
import {
  buildNetworkNodeOfflinePlan,
  canTakeNetworkNodeOffline,
  NETWORK_NODE_OFFLINE_CONFIRMATION_BODY,
  NETWORK_NODE_OFFLINE_CONFIRMATION_TITLE,
  type NetworkNodeOfflinePlan,
} from "@/lib/networkNodeOfflineAction";
import { useStructureActionMenu } from "@/hooks/useStructureActionMenu";
import { useStructurePower } from "@/hooks/useStructurePower";
import { useStructureRename } from "@/hooks/useStructureRename";
import { getStructurePowerAction, supportsStructureRename } from "@/lib/structureActionSupport";
import type { Structure } from "@/types/domain";

function formatPowerSuccessLabel(structure: Structure, nextOnline: boolean): string {
  const familyLabel = structure.type === "storage_unit"
    ? "Storage"
    : structure.type === "network_node"
      ? "Network node"
      : structure.type === "gate"
        ? "Gate"
        : "Turret";

  return `${familyLabel} ${nextOnline ? "brought online" : "taken offline"}. Awaiting read-model sync.`;
}

function formatRenameSuccessLabel(structure: Structure): string {
  return structure.type === "network_node"
    ? "Network node renamed. Awaiting read-model sync."
    : "Assembly renamed. Awaiting read-model sync.";
}

function formatRenameActionLabel(structure: Structure): string {
  return structure.type === "network_node" ? "Rename Node" : "Rename Assembly";
}

interface StructureActionContextOptions {
  nodeOfflineLookup?: NodeAssembliesLookupResult | null;
}

interface PendingNodeOfflineConfirmation {
  structure: Structure;
  plan: NetworkNodeOfflinePlan;
}

function buildStructureWriteTarget(structure: Structure) {
  return {
    objectId: structure.objectId,
    structureType: structure.type,
    ownerCapId: structure.ownerCapId,
    networkNodeId: structure.networkNodeId ?? null,
    assemblyId: structure.assemblyId ?? null,
    displayName: structure.name,
  };
}

export function useStructureSurfaceActions() {
  const power = useStructurePower();
  const rename = useStructureRename();
  const {
    contextMenu,
    menuRef,
    openStructureActionMenu,
    closeStructureActionMenu,
  } = useStructureActionMenu();
  const [renameTarget, setRenameTarget] = useState<Structure | null>(null);
  const [pendingNodeOfflineConfirmation, setPendingNodeOfflineConfirmation] = useState<PendingNodeOfflineConfirmation | null>(null);
  const [powerSuccessLabel, setPowerSuccessLabel] = useState("Structure power state updated");
  const [renameSuccessLabel, setRenameSuccessLabel] = useState("Assembly renamed");

  const getPowerActionForStructure = useCallback(
    (structure: Structure, options: StructureActionContextOptions = {}) => getStructurePowerAction(
      structure,
      structure.type === "network_node" && structure.status === "online"
        ? { networkNodeOfflineAvailable: canTakeNetworkNodeOffline(structure, options.nodeOfflineLookup) }
        : undefined,
    ),
    [],
  );

  const executePowerAction = useCallback(
    (structure: Structure, nextOnline: boolean, options: StructureActionContextOptions = {}) => {
      setPowerSuccessLabel(formatPowerSuccessLabel(structure, nextOnline));

      if (structure.type === "network_node") {
        if (!nextOnline) {
          const offlinePlan = buildNetworkNodeOfflinePlan(structure, options.nodeOfflineLookup);
          if (offlinePlan.unavailableReason) {
            throw new Error(offlinePlan.unavailableReason);
          }

          power.reset();
          setPendingNodeOfflineConfirmation({ structure, plan: offlinePlan });
          return Promise.resolve(false);
        }

        return power.bringNodeOnline(
          {
            nodeId: structure.objectId,
            ownerCapId: structure.ownerCapId,
          },
          {
            refetchSignalFeed: true,
            selectedNodeId: structure.objectId,
            target: buildStructureWriteTarget(structure),
          },
        );
      }

      return power.toggleSingle(
        {
          structureType: structure.type,
          structureId: structure.objectId,
          ownerCapId: structure.ownerCapId,
          networkNodeId: structure.networkNodeId!,
          online: nextOnline,
        },
        {
          refetchSignalFeed: true,
          target: {
            objectId: structure.objectId,
            structureType: structure.type,
            ownerCapId: structure.ownerCapId,
            networkNodeId: structure.networkNodeId ?? null,
            assemblyId: structure.assemblyId ?? null,
            displayName: structure.name,
          },
        },
      );
    },
    [power],
  );

  const closePowerConfirmation = useCallback(() => {
    if (power.status !== "pending") {
      setPendingNodeOfflineConfirmation(null);
    }
  }, [power.status]);

  const submitNodeOfflineConfirmation = useCallback(async () => {
    if (!pendingNodeOfflineConfirmation) {
      return false;
    }

    const { structure, plan } = pendingNodeOfflineConfirmation;
    const succeeded = await power.bringNodeOffline(
      {
        nodeId: structure.objectId,
        ownerCapId: structure.ownerCapId,
        connectedAssemblies: plan.connectedAssemblies,
      },
      {
        refetchSignalFeed: true,
        selectedNodeId: structure.objectId,
        target: buildStructureWriteTarget(structure),
        targets: plan.affectedTargets,
      },
    );

    if (succeeded) {
      setPendingNodeOfflineConfirmation(null);
    }

    return succeeded;
  }, [pendingNodeOfflineConfirmation, power]);

  const openRenameDialog = useCallback(
    (structure: Structure) => {
      rename.reset();
      setRenameSuccessLabel(formatRenameSuccessLabel(structure));
      setRenameTarget(structure);
    },
    [rename],
  );

  const closeRenameDialog = useCallback(() => {
    if (rename.status !== "pending") {
      setRenameTarget(null);
    }
  }, [rename.status]);

  const submitRename = useCallback(
    async (nextName: string) => {
      if (!renameTarget) {
        return false;
      }

      const succeeded = await rename.rename(
        {
          structureType: renameTarget.type,
          structureId: renameTarget.objectId,
          ownerCapId: renameTarget.ownerCapId,
          name: nextName,
        },
        {
          refetchSignalFeed: false,
          target: {
            objectId: renameTarget.objectId,
            structureType: renameTarget.type,
            ownerCapId: renameTarget.ownerCapId,
            networkNodeId: renameTarget.networkNodeId ?? null,
            assemblyId: renameTarget.assemblyId ?? null,
            displayName: renameTarget.name,
          },
        },
      );

      if (succeeded) {
        setRenameTarget(null);
      }

      return succeeded;
    },
    [rename, renameTarget],
  );

  const openStructureContextMenu = useCallback(
    (structure: Structure, clientX: number, clientY: number, options: StructureActionContextOptions = {}) => {
      const powerAction = getPowerActionForStructure(structure, options);
      const items = [
        ...(powerAction ? [{
          key: powerAction.nextOnline ? "bring-online" : "take-offline",
          label: powerAction.label,
          disabled: power.status === "pending" || powerAction.disabledReason != null,
          disabledReason: power.status === "pending"
            ? "Submitting structure power action…"
            : powerAction.disabledReason,
          tone: powerAction.tone,
          onSelect: () => {
            void executePowerAction(structure, powerAction.nextOnline, options);
          },
        }] : []),
        ...(supportsStructureRename(structure) ? [{
          key: "rename-assembly",
          label: formatRenameActionLabel(structure),
          disabled: rename.status === "pending",
          disabledReason: rename.status === "pending" ? "Submitting rename…" : null,
          onSelect: () => openRenameDialog(structure),
        }] : []),
      ];

      if (items.length === 0) {
        return;
      }

      openStructureActionMenu({
        structureId: structure.objectId,
        structureName: structure.name,
        clientX,
        clientY,
        items,
      });
    },
    [executePowerAction, getPowerActionForStructure, openRenameDialog, openStructureActionMenu, power.status, rename.status],
  );

  const openStructureContextMenuFromElement = useCallback(
    (structure: Structure, element: HTMLElement, options: StructureActionContextOptions = {}) => {
      const bounds = element.getBoundingClientRect();
      openStructureContextMenu(
        structure,
        bounds.left + bounds.width / 2,
        bounds.top + bounds.height / 2,
        options,
      );
    },
    [openStructureContextMenu],
  );

  return {
    power,
    rename,
    powerSuccessLabel,
    renameSuccessLabel,
    contextMenu,
    menuRef,
    renameTarget,
    executePowerAction,
    openStructureContextMenu,
    openStructureContextMenuFromElement,
    closeStructureContextMenu: closeStructureActionMenu,
    closeRenameDialog,
    closePowerConfirmation,
    dismissPowerFeedback: power.reset,
    dismissRenameFeedback: rename.reset,
    submitRename,
    getPowerActionForStructure,
    renderContextMenu: contextMenu ? (
      <StructureActionContextMenu menu={contextMenu} menuRef={menuRef} onClose={closeStructureActionMenu} />
    ) : null,
    renderRenameDialog: renameTarget ? (
      <StructureRenameDialog
        isOpen
        structureName={renameTarget.name}
        initialValue={renameTarget.name}
        title={renameTarget.type === "network_node" ? "Rename Node" : "Rename Assembly"}
        fieldLabel={renameTarget.type === "network_node" ? "Node Name" : "Assembly Name"}
        submitLabel={renameTarget.type === "network_node" ? "Rename Node" : "Rename Assembly"}
        isPending={rename.status === "pending"}
        error={rename.error}
        onClose={closeRenameDialog}
        onSubmit={(nextName) => {
          void submitRename(nextName);
        }}
      />
    ) : null,
    renderPowerConfirmDialog: pendingNodeOfflineConfirmation ? (
      <StructurePowerConfirmDialog
        isOpen
        title={NETWORK_NODE_OFFLINE_CONFIRMATION_TITLE}
        body={NETWORK_NODE_OFFLINE_CONFIRMATION_BODY}
        primaryLabel="Take offline"
        isPending={power.status === "pending"}
        error={power.status === "error" ? power.error : null}
        onCancel={closePowerConfirmation}
        onConfirm={() => {
          void submitNodeOfflineConfirmation();
        }}
      />
    ) : null,
  };
}