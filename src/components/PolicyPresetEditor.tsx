/**
 * PolicyPresetEditor — Preset composer for gate policy directives (v2a).
 *
 * Two posture tabs (Commercial / Defense). Each tab has:
 *   - Tribe entry table (tribe id, access toggle, toll input)
 *   - Default access + default toll fallback
 *   - Apply / Remove actions
 */

import { useState, useCallback } from "react";
import { TagChip } from "@/components/TagChip";
import { TribePicker } from "@/components/TribePicker";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { baseUnitsToLux, luxToBaseUnits, formatLux, formatEve } from "@/lib/currency";
import type { PolicyPreset, TxStatus, Tribe, PostureMode, GatePolicyTarget } from "@/types/domain";

interface PolicyPresetEditorProps {
  commercialPreset: PolicyPreset | null;
  defensePreset: PolicyPreset | null;
  isLoading: boolean;
  txStatus: TxStatus;
  onSetPreset: (
    mode: number,
    entries: { tribe: number; access: boolean; toll: number }[],
    defaultAccess: boolean,
    defaultToll: number,
  ) => void;
  onRemovePreset: (mode: number) => void;
  /** Other owned gates available for batch-apply (excludes the current gate). */
  batchTargets?: GatePolicyTarget[];
  /** Batch apply tx status. */
  batchTxStatus?: TxStatus;
  /** Callback to deploy a preset to selected gates. */
  onBatchApply?: (
    targets: GatePolicyTarget[],
    mode: number,
    entries: { tribe: number; access: boolean; toll: number }[],
    defaultAccess: boolean,
    defaultToll: number,
  ) => void;
}

interface DraftEntry {
  tribe: number;
  tribeName: string;
  access: boolean;
  tollLux: string;
}

const MODE_LABELS: Record<PostureMode, string> = {
  commercial: "Commercial",
  defense: "Defense",
};

const MODE_NUMBERS: Record<PostureMode, number> = {
  commercial: 0,
  defense: 1,
};

export function PolicyPresetEditor({
  commercialPreset,
  defensePreset,
  isLoading,
  txStatus,
  onSetPreset,
  onRemovePreset,
  batchTargets,
  batchTxStatus,
  onBatchApply,
}: PolicyPresetEditorProps) {
  const [activeTab, setActiveTab] = useState<PostureMode>("commercial");
  const isPending = txStatus === "pending" || batchTxStatus === "pending";

  if (isLoading) {
    return (
      <div className="border border-border/50 rounded p-4">
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading policy presets…
        </p>
      </div>
    );
  }

  const preset = activeTab === "commercial" ? commercialPreset : defensePreset;

  return (
    <div className="border border-border/50 rounded overflow-hidden">
      {/* Posture tabs */}
      <div className="flex border-b border-border/50">
        {(["commercial", "defense"] as PostureMode[]).map((mode) => {
          const isActive = activeTab === mode;
          const hasPreset = mode === "commercial" ? commercialPreset != null : defensePreset != null;
          return (
            <button
              key={mode}
              onClick={() => setActiveTab(mode)}
              className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-background text-foreground border-b-2 border-primary"
                  : "bg-muted/20 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {MODE_LABELS[mode]}
                {hasPreset && <TagChip label="SET" variant="success" size="sm" />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-4">
        <PresetTabContent
          mode={activeTab}
          modeNumber={MODE_NUMBERS[activeTab]}
          preset={preset}
          isPending={isPending}
          onSet={onSetPreset}
          onRemove={onRemovePreset}
          batchTargets={batchTargets}
          onBatchApply={onBatchApply}
        />
      </div>
    </div>
  );
}

interface PresetTabContentProps {
  mode: PostureMode;
  modeNumber: number;
  preset: PolicyPreset | null;
  isPending: boolean;
  onSet: PolicyPresetEditorProps["onSetPreset"];
  onRemove: PolicyPresetEditorProps["onRemovePreset"];
  batchTargets?: GatePolicyTarget[];
  onBatchApply?: PolicyPresetEditorProps["onBatchApply"];
}

function PresetTabContent({
  mode,
  modeNumber,
  preset,
  isPending,
  onSet,
  onRemove,
  batchTargets,
  onBatchApply,
}: PresetTabContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [entries, setEntries] = useState<DraftEntry[]>([]);
  const [defaultAccess, setDefaultAccess] = useState(true);
  const [defaultTollLux, setDefaultTollLux] = useState("");

  const loadFromPreset = useCallback((p: PolicyPreset) => {
    setEntries(
      p.entries.map((e) => ({
        tribe: e.tribe,
        tribeName: `Tribe #${e.tribe}`,
        access: e.access,
        tollLux: baseUnitsToLux(e.toll).toString(),
      })),
    );
    setDefaultAccess(p.defaultAccess);
    setDefaultTollLux(baseUnitsToLux(p.defaultToll).toString());
  }, []);

  function handleEdit() {
    if (preset) loadFromPreset(preset);
    else {
      setEntries([]);
      setDefaultAccess(true);
      setDefaultTollLux("");
    }
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
  }

  function handleAddTribe(tribe: Tribe) {
    if (entries.length >= 20) return;
    if (entries.some((e) => e.tribe === tribe.tribeId)) return;
    setEntries((prev) => [
      ...prev,
      { tribe: tribe.tribeId, tribeName: tribe.name, access: true, tollLux: "0" },
    ]);
  }

  function handleRemoveEntry(tribe: number) {
    setEntries((prev) => prev.filter((e) => e.tribe !== tribe));
  }

  function handleToggleAccess(tribe: number) {
    setEntries((prev) =>
      prev.map((e) => (e.tribe === tribe ? { ...e, access: !e.access } : e)),
    );
  }

  function handleTollChange(tribe: number, value: string) {
    setEntries((prev) =>
      prev.map((e) => (e.tribe === tribe ? { ...e, tollLux: value } : e)),
    );
  }

  function handleApply() {
    const mapped = entries.map((e) => ({
      tribe: e.tribe,
      access: e.access,
      toll: luxToBaseUnits(parseFloat(e.tollLux) || 0),
    }));
    const defToll = luxToBaseUnits(parseFloat(defaultTollLux) || 0);
    onSet(modeNumber, mapped, defaultAccess, defToll);
    setIsEditing(false);
  }

  function handleRemovePreset() {
    onRemove(modeNumber);
  }

  if (!preset && !isEditing) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <p className="text-sm text-muted-foreground/60">
          No {MODE_LABELS[mode].toLowerCase()} preset configured
        </p>
        <button
          onClick={handleEdit}
          disabled={isPending}
          className="text-[11px] px-4 py-1.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          Create Preset
        </button>
      </div>
    );
  }

  if (preset && !isEditing) {
    return (
      <div className="space-y-3">
        <PresetSummary preset={preset} />
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleEdit}
            disabled={isPending}
            className="text-[11px] px-3 py-1 rounded border border-border hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Edit
          </button>
          <button
            onClick={handleRemovePreset}
            disabled={isPending}
            className="text-[11px] px-3 py-1 rounded border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            Remove
          </button>
        </div>
        {batchTargets && batchTargets.length > 0 && onBatchApply && (
          <BatchApplySection
            mode={mode}
            modeNumber={modeNumber}
            preset={preset}
            targets={batchTargets}
            isPending={isPending}
            onBatchApply={onBatchApply}
          />
        )}
      </div>
    );
  }

  // Editing state — derive EVE equivalent from Lux input
  const eveEquivalent = (() => {
    const lux = parseFloat(defaultTollLux);
    if (!Number.isFinite(lux) || lux < 0) return null;
    return (lux / 100).toLocaleString(undefined, { maximumFractionDigits: 4 });
  })();

  return (
    <div className="space-y-4">
      {/* Tribe entries */}
      <div className="space-y-2">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
          Tribe Entries ({entries.length}/20)
        </p>
        {entries.map((entry) => (
          <div
            key={entry.tribe}
            className="flex items-center gap-2 bg-muted/10 rounded px-3 py-1.5"
          >
            <span className="text-xs font-mono text-foreground flex-1 truncate">
              {entry.tribeName} ({entry.tribe})
            </span>
            <button
              onClick={() => handleToggleAccess(entry.tribe)}
              className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                entry.access
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {entry.access ? "Allow" : "Deny"}
            </button>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Toll (Lux)"
              value={entry.tollLux}
              onChange={(e) => handleTollChange(entry.tribe, e.target.value)}
              className="w-24 bg-background border border-border rounded px-2 py-0.5 text-[11px] font-mono text-foreground"
            />
            <button
              onClick={() => handleRemoveEntry(entry.tribe)}
              className="text-muted-foreground hover:text-red-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {entries.length < 20 && (
          <TribePicker onSelect={handleAddTribe} placeholder="Add tribe…" />
        )}
      </div>

      {/* Default fallback */}
      <div className="border-t border-border/50 pt-3 space-y-2">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
          Default Policy (all other tribes)
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDefaultAccess(!defaultAccess)}
            className={`text-[11px] px-3 py-1 rounded font-medium ${
              defaultAccess
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {defaultAccess ? "Allow" : "Deny"}
          </button>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Default toll (Lux)"
            value={defaultTollLux}
            onChange={(e) => setDefaultTollLux(e.target.value)}
            className="w-32 bg-background border border-border rounded px-2 py-1 text-xs font-mono text-foreground"
          />
          {eveEquivalent != null && (
            <span className="text-[11px] text-muted-foreground/60">≈ {eveEquivalent} EVE</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end border-t border-border/50 pt-3">
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="text-[11px] px-3 py-1.5 rounded border border-border hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          disabled={isPending}
          className="text-[11px] px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50"
        >
          {preset ? "Update Preset" : "Deploy Preset"}
        </button>
      </div>
    </div>
  );
}

function PresetSummary({ preset }: { preset: PolicyPreset }) {
  return (
    <div className="space-y-2">
      {preset.entries.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
            Tribe Rules ({preset.entries.length})
          </p>
          {preset.entries.map((e) => (
            <div
              key={e.tribe}
              className="flex items-center gap-2 text-xs font-mono text-foreground bg-muted/10 rounded px-3 py-1"
            >
              <span className="flex-1">Tribe #{e.tribe}</span>
              <TagChip
                label={e.access ? "ALLOW" : "DENY"}
                variant={e.access ? "success" : "danger"}
                size="sm"
              />
              {e.toll > 0 && (
                <span className="text-muted-foreground">
                  {formatLux(e.toll)} Lux
                  <span className="ml-1 text-muted-foreground/60">({formatEve(e.toll)} EVE)</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/10 rounded px-3 py-2">
        <span className="font-medium">Default:</span>
        <TagChip
          label={preset.defaultAccess ? "ALLOW" : "DENY"}
          variant={preset.defaultAccess ? "success" : "danger"}
          size="sm"
        />
        {preset.defaultToll > 0 && (
          <span className="font-mono">
            {formatLux(preset.defaultToll)} Lux toll
            <span className="ml-1 text-muted-foreground/60">({formatEve(preset.defaultToll)} EVE)</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Batch Apply Section ────────────────────────────────

interface BatchApplySectionProps {
  mode: PostureMode;
  modeNumber: number;
  preset: PolicyPreset;
  targets: GatePolicyTarget[];
  isPending: boolean;
  onBatchApply: NonNullable<PolicyPresetEditorProps["onBatchApply"]>;
}

function BatchApplySection({
  mode,
  modeNumber,
  preset,
  targets,
  isPending,
  onBatchApply,
}: BatchApplySectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(targets.map((t) => t.gateId)));

  const toggleGate = useCallback((gateId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(gateId)) next.delete(gateId);
      else next.add(gateId);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(targets.map((t) => t.gateId)));
  }, [targets]);

  const selectNone = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedTargets = targets.filter((t) => selectedIds.has(t.gateId));

  function handleApplyToSelected() {
    if (selectedTargets.length === 0) return;
    const entries = preset.entries.map((e) => ({
      tribe: e.tribe,
      access: e.access,
      toll: e.toll,
    }));
    onBatchApply(selectedTargets, modeNumber, entries, preset.defaultAccess, preset.defaultToll);
  }

  function handleApplyToAll() {
    const entries = preset.entries.map((e) => ({
      tribe: e.tribe,
      access: e.access,
      toll: e.toll,
    }));
    onBatchApply(targets, modeNumber, entries, preset.defaultAccess, preset.defaultToll);
  }

  return (
    <div className="border-t border-border/50 pt-3 space-y-2">
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
        Deploy to Other Gates
      </p>
      <p className="text-[11px] text-muted-foreground/60">
        Copy this {MODE_LABELS[mode].toLowerCase()} preset to your other owned gates
      </p>

      <div className="flex gap-2">
        <button
          onClick={handleApplyToAll}
          disabled={isPending}
          className="text-[11px] px-4 py-1.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-50 font-medium"
        >
          Apply to All Gates ({targets.length})
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          disabled={isPending}
          className="text-[11px] px-3 py-1.5 rounded border border-border hover:bg-white/5 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
        >
          Select Gates
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 border border-border/30 rounded p-3 bg-muted/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {selectedIds.size} of {targets.length} selected
            </span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-[11px] text-primary hover:underline">All</button>
              <button onClick={selectNone} className="text-[11px] text-muted-foreground hover:underline">None</button>
            </div>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {targets.map((target) => (
              <label
                key={target.gateId}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/10 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(target.gateId)}
                  onChange={() => toggleGate(target.gateId)}
                  className="rounded border-border"
                />
                <span className="text-xs text-foreground truncate">{target.gateName}</span>
                <span className="text-[10px] font-mono text-muted-foreground/50 ml-auto">
                  {target.gateId.slice(0, 8)}…
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={handleApplyToSelected}
            disabled={isPending || selectedTargets.length === 0}
            className="w-full text-[11px] px-4 py-1.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-50 font-medium"
          >
            Apply to Selected ({selectedTargets.length})
          </button>
        </div>
      )}
    </div>
  );
}
