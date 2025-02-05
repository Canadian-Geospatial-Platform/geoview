import { memo, MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box } from '@/ui';

import { Attribution } from '@/core/components/attribution/attribution';
import { MousePosition } from '@/core/components/mouse-position/mouse-position';
import { Scale } from '@/core/components/scale/scale';
import { MapInfoExpandButton } from './map-info-expand-button';
import { MapInfoRotationButton } from './map-info-rotation-button';
import { MapInfoFixNorthSwitch } from './map-info-fixnorth-switch';
import { useMapInteraction } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

// Constants outside component to prevent recreating every render
const MAP_INFO_BASE_STYLES = {
  display: 'flex',
  alignItems: 'center',
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  px: '1rem',
  zIndex: 1000,
} as const;

const FLEX_STYLE = { flexGrow: 1, height: '100%' };

/**
 * Create a map information element that contains attribtuion, mouse position and scale
 *
 * @returns {JSX.Element} the map information element
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const MapInfo = memo(function MapInfo(): JSX.Element {
  logger.logTraceRender('components/map-info/map-info');

  // Hooks
  const theme = useTheme();
  const mapInfoRef = useRef<HTMLDivElement>();

  // Store
  const interaction = useMapInteraction(); // Static map, do not display mouse position or rotation controls
  const mapId = useGeoViewMapId(); // Element id for panel height (expanded)

  // State
  const [expanded, setExpanded] = useState(false);

  // Memoize values
  const containerStyles = useMemo(
    () => ({
      ...MAP_INFO_BASE_STYLES,
      height: expanded ? '6rem' : '3rem',
      background: theme.palette.geoViewColor.bgColor.dark[800],
      color: theme.palette.geoViewColor.bgColor.light[800],
    }),
    [expanded, theme.palette.geoViewColor.bgColor]
  );

  // Scroll the map into view on mouse click in the flex area
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('MAP INFO - scrollIntoViewListener');

    if (!mapInfoRef?.current) return () => {};

    const handleClick = (): void => {
      const behaviorScroll = (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth') as ScrollBehavior;

      document.getElementById(`shell-${mapId}`)?.scrollIntoView({
        behavior: behaviorScroll,
        block: 'start',
      });
    };

    const flexBoxes = mapInfoRef.current.querySelectorAll(`.${mapId}-mapInfo-flex`);
    flexBoxes.forEach((item) => item.addEventListener('click', handleClick));

    // Cleanup function to remove event listener
    return () => {
      flexBoxes.forEach((item) => item.removeEventListener('click', handleClick));
    };
  }, [mapInfoRef, mapId]);

  const handleExpand = useCallback((value: boolean) => {
    setExpanded(value);
  }, []);

  return (
    <Box ref={mapInfoRef as MutableRefObject<HTMLDivElement>} id={`${mapId}-mapInfo`} sx={containerStyles}>
      <MapInfoExpandButton onExpand={handleExpand} expanded={expanded} />
      <Attribution />
      {interaction === 'dynamic' && (
        <>
          <div className={`${mapId}-mapInfo-flex`} style={FLEX_STYLE} />
          <MousePosition expanded={expanded} />
        </>
      )}
      <Scale expanded={expanded} />
      <div className={`${mapId}-mapInfo-flex`} style={FLEX_STYLE} />
      {interaction === 'dynamic' && (
        <>
          <MapInfoFixNorthSwitch expanded={expanded} />
          <MapInfoRotationButton />
        </>
      )}
    </Box>
  );
});
