import React from 'react';

import logoSrc from 'assets/logos/logo_mpc_brasil.png';

export type LogoProps = {
  /**
   * Controls the rendered width of the logo. Height scales proportionally.
   * Accepts a number (pixels) or any CSS width string (e.g., '50%', '12rem').
   */
  size?: number | string;
  /** Accessible alt text */
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
};

export const Logo: React.FC<LogoProps> = ({
  size = 160,
  alt = 'MPC Brasil',
  className,
  style,
}) => {
  const width = typeof size === 'number' ? `${size}px` : size;

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={className}
      style={{ width, height: 'auto', display: 'block', ...style }}
      loading="lazy"
    />
  );
};

export default Logo;
