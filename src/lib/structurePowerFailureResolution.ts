import type { StructureWriteRefreshOptions } from "@/hooks/useStructureWriteRefresh";
import { getMoveAbortCommandIndex } from "@/lib/structurePowerErrors";
import type { StructureStatus } from "@/types/domain";

export type ExactPowerStatus = Extract<StructureStatus, "online" | "offline">;

export function toDesiredPowerStatus(online: boolean): ExactPowerStatus {
  return online ? "online" : "offline";
}

function getRefreshTargets(refreshOptions: StructureWriteRefreshOptions | undefined) {
  return refreshOptions?.targets?.length
    ? refreshOptions.targets
    : refreshOptions?.target
      ? [refreshOptions.target]
      : [];
}

function getTargetDesiredStatus(
  target: ReturnType<typeof getRefreshTargets>[number],
  fallbackDesiredStatus: ExactPowerStatus | null,
): ExactPowerStatus | null {
  if (target.desiredStatus === "online" || target.desiredStatus === "offline") {
    return target.desiredStatus;
  }

  return fallbackDesiredStatus;
}

function getFailedActionTargetIndex(rawError: string): number | null {
  const commandIndex = getMoveAbortCommandIndex(rawError);
  if (commandIndex == null || commandIndex % 3 !== 1) {
    return null;
  }

  return (commandIndex - 1) / 3;
}

export function getStructureWriteRefreshTargetCount(
  refreshOptions: StructureWriteRefreshOptions | undefined,
): number {
  return getRefreshTargets(refreshOptions).length;
}

export function resolvePowerErrorDesiredStatus(
  rawError: string,
  fallbackDesiredStatus: ExactPowerStatus | null,
  refreshOptions: StructureWriteRefreshOptions | undefined,
): ExactPowerStatus | null {
  const targets = getRefreshTargets(refreshOptions);
  const targetIndex = getFailedActionTargetIndex(rawError);
  if (targetIndex != null) {
    const target = targets[targetIndex];
    return target ? getTargetDesiredStatus(target, fallbackDesiredStatus) : fallbackDesiredStatus;
  }

  const offlineTargets = targets.filter((target) => getTargetDesiredStatus(target, fallbackDesiredStatus) === "offline");
  return offlineTargets.length === 1 ? "offline" : fallbackDesiredStatus;
}

export function resolveAlreadyOfflineCorrectionTarget(
  rawError: string,
  fallbackDesiredStatus: ExactPowerStatus | null,
  refreshOptions: StructureWriteRefreshOptions | undefined,
) {
  const targets = getRefreshTargets(refreshOptions);
  const targetIndex = getFailedActionTargetIndex(rawError);
  if (targetIndex != null) {
    const target = targets[targetIndex];
    return target && getTargetDesiredStatus(target, fallbackDesiredStatus) === "offline" ? target : null;
  }

  const offlineTargets = targets.filter((target) => getTargetDesiredStatus(target, fallbackDesiredStatus) === "offline");
  return offlineTargets.length === 1 ? offlineTargets[0]! : null;
}