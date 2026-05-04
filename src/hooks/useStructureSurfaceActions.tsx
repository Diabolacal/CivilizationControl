import { useCallback, useState } from "react";

import { StructureActionContextMenu } from "@/components/structure-actions/StructureActionContextMenu";
import { StructureRenameDialog } from "@/components/structure-actions/StructureRenameDialog";
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
  const [powerSuccessLabel, setPowerSuccessLabel] = useState("Structure power state updated");
  const [renameSuccessLabel, setRenameSuccessLabel] = useState("Assembly renamed");

  const executePowerAction = useCallback(
    (structure: Structure, nextOnline: boolean) => {
      setPowerSuccessLabel(formatPowerSuccessLabel(structure, nextOnline));

      if (structure.type === "network_node") {
        return power.bringNodeOnline(
          {
            nodeId: structure.objectId,
            ownerCapId: structure.ownerCapId,
          },
          {
            refetchSignalFeed: true,
            target: {
              objectId: structure.objectId,
              structureType: structure.type,
              ownerCapId: structure.ownerCapId,
              assemblyId: structure.assemblyId ?? null,
              displayName: structure.name,
            },
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
    (structure: Structure, clientX: number, clientY: number) => {
      const powerAction = getStructurePowerAction(structure);
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
            void executePowerAction(structure, powerAction.nextOnline);
          },
        }] : []),
        ...(supportsStructureRename(structure) ? [{
          key: "rename-assembly",
          label: "Rename Assembly",
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
    [executePowerAction, openRenameDialog, openStructureActionMenu, power.status, rename.status],
  );

  const openStructureContextMenuFromElement = useCallback(
    (structure: Structure, element: HTMLElement) => {
      const bounds = element.getBoundingClientRect();
      openStructureContextMenu(
        structure,
        bounds.left + bounds.width / 2,
        bounds.top + bounds.height / 2,
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
    dismissPowerFeedback: power.reset,
    dismissRenameFeedback: rename.reset,
    submitRename,
    renderContextMenu: contextMenu ? (
      <StructureActionContextMenu menu={contextMenu} menuRef={menuRef} onClose={closeStructureActionMenu} />
    ) : null,
    renderRenameDialog: renameTarget ? (
      <StructureRenameDialog
        isOpen
        structureName={renameTarget.name}
        initialValue={renameTarget.name}
        isPending={rename.status === "pending"}
        error={rename.error}
        onClose={closeRenameDialog}
        onSubmit={(nextName) => {
          void submitRename(nextName);
        }}
      />
    ) : null,
  };
}