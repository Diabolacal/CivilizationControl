/**
 * SolarSystemPicker — Autocomplete input for assigning a solar system to a network node.
 *
 * Primary onboarding interaction: user searches by solar system name,
 * selects a result, and the pin is applied at the network node level.
 */

import { useState, useRef, useEffect } from "react";
import { useSolarSystemSearch } from "@/hooks/useSolarSystem";
import type { SolarSystem } from "@/types/domain";
import { SolarSystemAggregateGlyph } from "@/components/topology/Glyphs";

interface SolarSystemPickerProps {
  onSelect: (system: SolarSystem) => void;
  placeholder?: string;
  currentSystemName?: string;
}

export function SolarSystemPicker({
  onSelect,
  placeholder = "Search solar systems...",
  currentSystemName,
}: SolarSystemPickerProps) {
  const { searchQuery, setSearchQuery, results, isLoading } =
    useSolarSystemSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(system: SolarSystem) {
    onSelect(system);
    setSearchQuery("");
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Current assignment badge */}
      {currentSystemName && !isOpen && (
        <div className="flex items-center gap-2 mb-2">
          <SolarSystemAggregateGlyph
            size={16}
            className="text-muted-foreground"
          />
          <span className="text-sm text-foreground">{currentSystemName}</span>
        </div>
      )}

      {/* Search input */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setIsOpen(true);
          setSelectedIndex(0);
        }}
        onFocus={() => {
          if (searchQuery.length >= 2) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-[var(--input-background)] border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30"
      />

      {isLoading && (
        <p className="text-[11px] text-muted-foreground mt-1">
          Loading solar system catalog...
        </p>
      )}

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[var(--popover)] border border-border rounded shadow-lg max-h-60 overflow-y-auto">
          {results.map((system, index) => (
            <button
              key={system.solarSystemId}
              onClick={() => handleSelect(system)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                index === selectedIndex
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted/10"
              }`}
            >
              <SolarSystemAggregateGlyph size={14} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {system.solarSystemName}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  ID: {system.solarSystemId}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && searchQuery.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full bg-[var(--popover)] border border-border rounded p-3">
          <p className="text-sm text-muted-foreground">No systems found</p>
        </div>
      )}
    </div>
  );
}
