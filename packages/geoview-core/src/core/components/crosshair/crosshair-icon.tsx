import { memo } from 'react';

import { logger } from '@/core/utils/logger';

/**
 * Renders the crosshair SVG icon.
 *
 * Memoized because it has no props and renders a static SVG that never changes.
 *
 * @returns The crosshair icon element
 */
export const CrosshairIcon = memo(function CrosshairIcon(): JSX.Element {
  // Log
  logger.logTraceRender('components/crosshair/crosshair-icon');

  return (
    <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0 0 275 275" focusable="false">
      <g fill="none" stroke="#616161" strokeWidth="1px" id="crosshairs" transform="translate(0 -1824.72) scale(2)">
        <path d="m136.18 983.66-130.93-0.00001m65.467-65.467v130.93m32.2-65.466c0 17.784-14.417 32.2-32.2 32.2-17.784 0-32.2-14.417-32.2-32.2 0-17.784 14.417-32.2 32.2-32.2 17.784 0 32.2 14.417 32.2 32.2z" />
      </g>
    </svg>
  );
});
