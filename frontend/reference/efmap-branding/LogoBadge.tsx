/**
 * LogoBadge – Reusable brand badge component (visual container only).
 *
 * Reverse-engineered from the EF-Map CameraCompass badge.
 * Self-contained: scoped CSS module, no dependency on compass/navigation logic.
 *
 * Usage:
 *   import LogoBadge from './LogoBadge';
 *   import logoGlyph from '../../assets/logo/logo-glyph.svg';
 *
 *   <LogoBadge logo={<img src={logoGlyph} alt="EF Map" />} />
 *
 * All visual defaults match the live EF-Map badge exactly:
 *   size 96px, radius 10px, glassmorphism background, triple-layer glow.
 */
import { type CSSProperties, type FC, type ReactNode } from 'react';
import styles from './LogoBadge.module.css';

/* ===================================================================
   Design-token defaults (keep in sync with LogoBadge.module.css :root)
   =================================================================== */
const DEFAULTS = {
  /** Square container size in px */
  size: 96,
  /** Corner radius in px */
  radius: 10,
  /** EF-Map accent orange */
  accentColor: '#ff4c26',
  /** Fixed-position bottom offset in px */
  bottom: 10,
  /** Fixed-position right offset in px */
  right: 10,
  /** Z-index for the fixed wrapper */
  zIndex: 3400,
} as const;

/* ===================================================================
   Props
   =================================================================== */
export interface LogoBadgeProps {
  /** Content rendered inside the badge — typically an <img> or inline SVG. */
  logo: ReactNode;

  /**
   * Accent / brand color. Drives hover border + glow tint.
   * @default '#ff4c26' (EF-Map orange)
   */
  accentColor?: string;

  /**
   * Square size in pixels.
   * @default 96
   */
  size?: number;

  /**
   * Bottom offset in pixels (position: fixed).
   * @default 10
   */
  bottom?: number;

  /**
   * Right offset in pixels (position: fixed).
   * @default 10
   */
  right?: number;

  /**
   * Stacking order.
   * @default 3400
   */
  zIndex?: number;

  /** Extra class name applied to the outermost wrapper. */
  className?: string;

  /** Extra inline styles applied to the outermost wrapper. */
  style?: CSSProperties;
}

/* ===================================================================
   Component
   =================================================================== */
const LogoBadge: FC<LogoBadgeProps> = ({
  logo,
  accentColor = DEFAULTS.accentColor,
  size = DEFAULTS.size,
  bottom = DEFAULTS.bottom,
  right = DEFAULTS.right,
  zIndex = DEFAULTS.zIndex,
  className,
  style,
}) => {
  /**
   * Inject per-instance CSS custom properties so the module stylesheet
   * can derive all visuals from them — keeps the CSS side clean.
   */
  const wrapperVars: CSSProperties = {
    bottom: `${bottom}px`,
    right: `${right}px`,
    zIndex,
    /* Forward to the CSS module tokens */
    ['--logo-badge-size' as string]: `${size}px`,
    ['--logo-badge-radius' as string]: `${Math.round(size * (DEFAULTS.radius / DEFAULTS.size))}px`,
    ['--logo-badge-accent' as string]: accentColor,
    ['--logo-badge-glyph-ratio' as string]: '78%',
    ...style,
  };

  return (
    <div
      className={`${styles.wrapper}${className ? ` ${className}` : ''}`}
      style={wrapperVars}
    >
      <div className={styles.badge} aria-hidden="true">
        <span className={styles.background} />
        <span className={styles.glyph}>{logo}</span>
      </div>
    </div>
  );
};

export default LogoBadge;
