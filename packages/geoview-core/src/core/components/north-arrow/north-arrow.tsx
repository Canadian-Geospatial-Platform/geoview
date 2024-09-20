import { useRef } from 'react';

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
 * Create a north arrow
 *
 * @returns {JSX.Element} the north arrow component
 */
export function NorthArrow(): JSX.Element {
  // Log
  logger.logTraceRender('components/north-arrow/north-arrow');

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal component state (do not use useState for item used inside function only without rendering... use useRef)
  const northArrowRef = useRef<HTMLDivElement>(null);

  // get the values from store
  const mapProjection = useMapProjection();
  const northArrowElement = useMapNorthArrowElement();

  const { rotationAngle, northOffset } = useManageArrow();

  return `EPSG:${mapProjection}` === Projection.PROJECTION_NAMES.LCC || `EPSG:${mapProjection}` !== Projection.PROJECTION_NAMES.WM ? (
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
      <NorthArrowIcon width={sxClasses.northArrow.width} height={sxClasses.northArrow.height} />
    </Box>
  ) : (
    <Box />
  );
}

/**
 * Create a north pole flag icon
 * @returns {JSX.Element} the north pole marker icon
 */
export function NorthPoleFlag(): JSX.Element {
  const mapId = useGeoViewMapId();

  // internal state
  const northPoleId = `${mapId}-northpole`;
  const northPoleRef = useRef<HTMLDivElement | null>(null);

  // get the values from store
  const mapProjection = useMapProjection();
  const { setOverlayNorthMarkerRef } = useMapStoreActions();
  setTimeout(() => setOverlayNorthMarkerRef(northPoleRef.current as HTMLElement), 0); // set marker reference

  return (
    <Box
      ref={northPoleRef}
      id={northPoleId}
      style={{ visibility: `EPSG:${mapProjection}` === Projection.PROJECTION_NAMES.LCC ? 'visible' : 'hidden' }}
    >
      <NorthPoleIcon />
    </Box>
  );
}
