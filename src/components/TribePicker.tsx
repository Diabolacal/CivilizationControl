/**
 * TribePicker — Autocomplete input for selecting a tribe by name, tag, or numeric ID.
 *
 * Supports two entry modes:
 * 1. Name/tag search against the curated catalog (if populated)
 * 2. Direct numeric tribe ID entry (always works, falls back to "Tribe #<id>")
 *
 * Chain/RPC is the source of truth for tribe IDs. This picker provides
 * optional name enrichment from the curated catalog.
 */

import { useState, useRef, useEffect } from "react";
import { useTribeSearch } from "@/hooks/useTribe";
import { resolveTribeName } from "@/lib/tribeCatalog";
import type { Tribe } from "@/types/domain";

interface TribePickerProps {
  onSelect: (tribe: Tribe) => void;
  placeholder?: string;
}

export function TribePicker({
  onSelect,
  placeholder = "Search tribes or enter numeric ID…",
}: TribePickerProps) {
  const { searchQuery, setSearchQuery, results } = useTribeSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if the current query is a valid numeric tribe ID
  const numericId = /^\d+$/.test(searchQuery.trim())
    ? Number(searchQuery.trim())
    : null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(tribe: Tribe) {
    onSelect(tribe);
    setSearchQuery("");
    setIsOpen(false);
  }

  function handleNumericSubmit() {
    if (numericId === null) return;
    const name = resolveTribeName(numericId);
    const nameShort = name.startsWith("Tribe #") ? "" : name;
    handleSelect({ tribeId: numericId, name, nameShort });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && results.length > 0) {
        handleSelect(results[selectedIndex]);
      } else if (numericId !== null) {
        handleNumericSubmit();
      }
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setIsOpen(true);
          setSelectedIndex(0);
        }}
        onFocus={() => {
          if (searchQuery.length >= 1) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30"
      />

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[var(--popover)] border border-border rounded shadow-lg max-h-60 overflow-y-auto">
          {results.map((tribe, index) => (
            <button
              key={tribe.tribeId}
              onClick={() => handleSelect(tribe)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                index === selectedIndex
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted/10"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {tribe.name}
                  {tribe.nameShort && (
                    <span className="ml-1.5 text-muted-foreground font-normal">
                      [{tribe.nameShort}]
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  ID: {tribe.tribeId}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && searchQuery.length >= 1 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[var(--popover)] border border-border rounded p-3">
          {numericId !== null ? (
            <button
              onClick={handleNumericSubmit}
              className="w-full text-left text-sm text-foreground hover:text-primary transition-colors"
            >
              Add <span className="font-mono font-medium">{resolveTribeName(numericId)}</span>
              <span className="ml-1.5 text-muted-foreground">(ID: {numericId})</span>
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tribes found — enter a numeric ID to add directly
            </p>
          )}
        </div>
      )}
    </div>
  );
}
