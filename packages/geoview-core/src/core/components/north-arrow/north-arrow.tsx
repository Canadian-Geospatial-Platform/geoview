import { memo, useMemo, useRef } from 'react';

import { useTheme } from '@mui/material/styles';

import { Box } from '@/ui';
import { Projection } from '@/geo/utils/projection';
import { NorthArrowIcon, NorthPoleIcon } from './north-arrow-icon';
import { getSxClasses } from './north-arrow-style';
import { useMapNorthArrowElement, useMapProjection, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

import useManageArrow from './hooks/useManageArrow';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';

/**
 * Create a north arrow component
 *
 * @returns {JSX.Element} the north arrow component
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const NorthArrow = memo(function NorthArrow(): JSX.Element {
  logger.logTraceRender('components/north-arrow/north-arrow');

  // Hooks
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // State (no useState for item used inside function only without rendering... use useRef)
  const northArrowRef = useRef<HTMLDivElement>(null);

  // Store
  const mapProjection = useMapProjection();
  const northArrowElement = useMapNorthArrowElement();
  const { rotationAngle, northOffset } = useManageArrow();

  // Memoize this check as it's used in conditional rendering
  const isValidProjection = useMemo(
    () => `EPSG:${mapProjection}` === Projection.PROJECTION_NAMES.LCC || `EPSG:${mapProjection}` === Projection.PROJECTION_NAMES.WM,
    [mapProjection]
  );

  if (!isValidProjection) return <Box />;

  return (
    <Box
      ref={northArrowRef}
      sx={sxClasses.northArrowContainer}
      style={{
        transition: theme.transitions.create(['all', 'transform'], {
          duration: theme.transitions.duration.standard,
          easing: theme.transitions.easing.easeOut,
        }),
        transform: `rotate(${rotationAngle.angle}deg)`,
        visibility: northArrowElement.isNorthVisible ? 'hidden' : 'visible',
        left: northOffset,
      }}
    >
      <NorthArrowIcon width={sxClasses.northArrow.width || 30} height={sxClasses.northArrow.height || 30} />
    </Box>
  );
});

/**
 * Create a north pole flag icon
 * @returns {JSX.Element} the north pole marker icon
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const NorthPoleFlag = memo(function NorthPoleFlag(): JSX.Element {
  // State
  const northPoleId = `${useGeoViewMapId()}-northpole`;
  const northPoleRef = useRef<HTMLDivElement | null>(null);

  // Store
  const mapProjection = useMapProjection();
  const { setOverlayNorthMarkerRef } = useMapStoreActions();
  setTimeout(() => setOverlayNorthMarkerRef(northPoleRef.current as HTMLElement), 0); // set marker reference

  const isVisible = `EPSG:${mapProjection}` === Projection.PROJECTION_NAMES.LCC;

  return (
    <Box ref={northPoleRef} id={northPoleId} style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
      <NorthPoleIcon />
    </Box>
  );
});
