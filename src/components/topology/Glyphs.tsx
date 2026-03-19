/**
 * Topology glyph components — wrapping the project's SVG assets.
 *
 * Each glyph renders the canonical SVG from assets/icons/glyphs/,
 * using currentColor for stroke so the parent can set color via text-*.
 *
 * These replace Figma-exported lucide-react placeholders for structure icons.
 * Reference: SVG Topology Layer Spec §2, assets/icons/glyphs/README.md.
 */

interface GlyphProps {
  className?: string;
  size?: number;
}

export function GateGlyph({ className = "", size = 24 }: GlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-label="Gate"
    >
      <path
        d="M 19.93,10.96 A 8,8 0 0,0 4.07,10.96
           M 4.07,13.04  A 8,8 0 0,0 19.93,13.04"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinecap="butt"
      />
    </svg>
  );
}

export function NetworkNodeGlyph({ className = "", size = 24 }: GlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-label="Network Node"
    >
      <polygon
        points="12,3 19.79,7.5 19.79,16.5 12,21 4.21,16.5 4.21,7.5"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinejoin="miter"
      />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TurretGlyph({ className = "", size = 24 }: GlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-label="Turret"
    >
      <polygon
        points="12,2.76 20,16.62 4,16.62"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function TradePostGlyph({ className = "", size = 24 }: GlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-label="Trade Post"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinejoin="miter"
      />
      <rect
        x="8"
        y="8"
        width="8"
        height="8"
        stroke="currentColor"
        fill="none"
        strokeWidth="1"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function SolarSystemAggregateGlyph({
  className = "",
  size = 32,
}: GlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 24"
      width={size}
      height={(size * 24) / 32}
      className={className}
      aria-label="Solar System"
    >
      <rect
        x="1"
        y="1"
        width="30"
        height="22"
        rx="4"
        ry="4"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

/**
 * Map a structure type to its glyph component.
 */
export function StructureGlyph({
  type,
  className = "",
  size = 24,
}: GlyphProps & { type: string }) {
  switch (type) {
    case "gate":
      return <GateGlyph className={className} size={size} />;
    case "storage_unit":
      return <TradePostGlyph className={className} size={size} />;
    case "turret":
      return <TurretGlyph className={className} size={size} />;
    case "network_node":
      return <NetworkNodeGlyph className={className} size={size} />;
    default:
      return <NetworkNodeGlyph className={className} size={size} />;
  }
}
