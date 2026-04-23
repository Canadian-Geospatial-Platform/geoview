import { memo, useEffect, useMemo, useRef } from 'react';

import { useTheme } from '@mui/material/styles';

import { Box } from '@/ui';
import { Projection } from '@/geo/utils/projection';
import { NorthArrowIcon, NorthPoleIcon } from './north-arrow-icon';
import { getSxClasses } from './north-arrow-style';
import { useStoreMapNorthArrowElement, useStoreMapCurrentProjectionEPSG } from '@/core/stores/store-interface-and-intial-values/map-state';

import { useManageArrow } from './hooks/useManageArrow';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { useMapController } from '@/core/controllers/use-controllers';

/**
 * Creates a north arrow component.
 *
 * Memoized to prevent re-renders since the component has no props and relies entirely on store state.
 *
 * @returns The north arrow component
 */
export const NorthArrow = memo(function NorthArrow(): JSX.Element {
  logger.logTraceRender('components/north-arrow/north-arrow');

  // Hooks
  const theme = useTheme();
  const memoSxClasses = useMemo(() => {
    logger.logTraceUseMemo('NORTH-ARROW - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // State (no useState for item used inside function only without rendering... use useRef)
  const northArrowRef = useRef<HTMLDivElement>(null);

  // Store
  const mapProjectionEPSG = useStoreMapCurrentProjectionEPSG();
  const northArrowElement = useStoreMapNorthArrowElement();
  const { rotationAngle, northOffset } = useManageArrow();

  /**
   * Checks whether the map projection supports a north arrow.
   */
  const memoIsValidProjection = useMemo(() => {
    logger.logTraceUseMemo('NORTH-ARROW - memoIsValidProjection', mapProjectionEPSG);
    return mapProjectionEPSG === Projection.PROJECTION_NAMES.LCC || mapProjectionEPSG === Projection.PROJECTION_NAMES.WM;
  }, [mapProjectionEPSG]);

  if (!memoIsValidProjection) return <Box />;

  return (
    <Box
      ref={northArrowRef}
      sx={memoSxClasses.northArrowContainer}
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
      <NorthArrowIcon width={memoSxClasses.northArrow.width || 30} height={memoSxClasses.northArrow.height || 30} />
    </Box>
  );
});

/**
 * Creates a north pole flag marker icon.
 *
 * Memoized to prevent re-renders since the component has no props and relies entirely on store state.
 *
 * @returns The north pole marker component
 */
export const NorthPoleFlag = memo(function NorthPoleFlag(): JSX.Element {
  // State
  const northPoleRef = useRef<HTMLDivElement | null>(null);

  // Store
  const mapId = useStoreGeoViewMapId();
  const mapProjectionEPSG = useStoreMapCurrentProjectionEPSG();
  const isVisible = mapProjectionEPSG === Projection.PROJECTION_NAMES.LCC;
  const mapController = useMapController();

  /**
   * Registers the north pole marker overlay ref on mount.
   */
  useEffect(() => {
    logger.logTraceUseEffect('NORTH-ARROW - register north pole marker overlay ref', mapController);
    mapController.setNorthPoleMarkerOverlayRef(northPoleRef.current!);
  }, [mapController]);

  return (
    <Box ref={northPoleRef} id={`${mapId}-northpole`} style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
      <NorthPoleIcon />
    </Box>
  );
});
