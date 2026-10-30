import { memo } from 'react';

import { logger } from '@/core/utils/logger';

/**
 * Renders the crosshair SVG icon.
 *
 * Memoized because it has no props and renders a static SVG that never changes.
 *
 * @returns The crosshair icon element
 */
export const CrosshairIcon = memo((): JSX.Element => {
  // Log
  logger.logTraceRender('components/crosshair/crosshair-icon');

  return (
    <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0 0 275 275" focusable="false">
      <g fill="none" stroke="#616161" strokeWidth="2">
        <path d="M6.57 137.5h261.86M137.5 6.57v261.86" />
        <circle cx="137.5" cy="137.5" r="64.4" />
      </g>
    </svg>
  );
});
CrosshairIcon.displayName = 'CrosshairIcon';
