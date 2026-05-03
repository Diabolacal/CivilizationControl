/**
 * LogoBadge — Fixed-position brand badge anchored to the sidebar rail.
 *
 * Adapted from the EFMap CameraCompass badge pattern.
 * Glassmorphism background with triple-layer glow, accent hover.
 * Background reads as black (0.85 opacity) per operator guidance.
 */
import { type FC } from 'react';

import styles from './LogoBadge.module.css';
import logoSrc from '../../assets/logo/civilizationcontrol-logo.png';

const LogoBadge: FC = () => (
  <div className={styles.wrapper}>
    <div className={styles.badge} aria-hidden="true">
      <span className={styles.background} />
      <span className={styles.glyph}>
        <img src={logoSrc} alt="CivilizationControl" />
      </span>
    </div>
  </div>
);

export { LogoBadge };
