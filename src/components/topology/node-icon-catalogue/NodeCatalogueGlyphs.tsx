interface CatalogueGlyphProps {
  className?: string;
  size?: number;
}

function CatalogueSvg({
  children,
  className = "",
  size = 24,
  label,
}: CatalogueGlyphProps & { children: React.ReactNode; label: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-label={label}
    >
      {children}
    </svg>
  );
}

export function PrinterGlyph({ className = "", size = 24 }: CatalogueGlyphProps) {
  return (
    <CatalogueSvg className={className} size={size} label="Printer">
      <polygon
        points="12,3 20,12 12,21 4,12"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinejoin="miter"
      />
      <path
        d="M 12 7 L 12 17"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinecap="butt"
      />
    </CatalogueSvg>
  );
}

export function RefineryGlyph({ className = "", size = 24 }: CatalogueGlyphProps) {
  return (
    <CatalogueSvg className={className} size={size} label="Refinery">
      <polygon
        points="12,3 20,12 12,21 4,12"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinejoin="miter"
      />
      <path
        d="M 8 12 H 16"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinecap="butt"
      />
    </CatalogueSvg>
  );
}

export function AssemblerGlyph({ className = "", size = 24 }: CatalogueGlyphProps) {
  return (
    <CatalogueSvg className={className} size={size} label="Assembler">
      <polygon
        points="12,3 20,12 12,21 4,12"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinejoin="miter"
      />
      <rect
        x="7.5"
        y="9"
        width="5"
        height="5"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />
      <rect
        x="11.5"
        y="11"
        width="5"
        height="5"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />
    </CatalogueSvg>
  );
}

export function BerthGlyph({ className = "", size = 24 }: CatalogueGlyphProps) {
  return (
    <CatalogueSvg className={className} size={size} label="Berth">
      <path
        d="M 6 6 V 18 H 8 V 10 H 16 V 18 H 18 V 6"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinejoin="miter"
      />
      <path
        d="M 10 13.5 H 14"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="butt"
      />
    </CatalogueSvg>
  );
}

export function RelayGlyph({ className = "", size = 24 }: CatalogueGlyphProps) {
  return (
    <CatalogueSvg className={className} size={size} label="Relay">
      <path
        d="M 12 5 V 19 M 8 10 L 12 6 L 16 10 M 9 14 H 15 M 10 18 H 14"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
    </CatalogueSvg>
  );
}

export function NurseryGlyph({ className = "", size = 24 }: CatalogueGlyphProps) {
  return (
    <CatalogueSvg className={className} size={size} label="Nursery">
      <path
        d="M 7.25 15.75 C 7.25 11.4, 9.4 8.25, 12 8.25 C 14.6 8.25, 16.75 11.4, 16.75 15.75"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 8.5 17.5 H 15.5"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </CatalogueSvg>
  );
}

export function HangarGlyph({ className = "", size = 24 }: CatalogueGlyphProps) {
  return (
    <CatalogueSvg className={className} size={size} label="Hangar">
      <circle
        cx="12"
        cy="12"
        r="6.5"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
      />
      <path
        d="M 8.75 9.5 H 15.25"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </CatalogueSvg>
  );
}

export function NestGlyph({ className = "", size = 24 }: CatalogueGlyphProps) {
  return (
    <CatalogueSvg className={className} size={size} label="Nest">
      <path
        d="M 7.25 15.75 C 7.25 11.4, 9.4 8.25, 12 8.25 C 14.6 8.25, 16.75 11.4, 16.75 15.75"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 8.5 17 H 15.5 M 9.25 19 H 14.75"
        stroke="currentColor"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </CatalogueSvg>
  );
}