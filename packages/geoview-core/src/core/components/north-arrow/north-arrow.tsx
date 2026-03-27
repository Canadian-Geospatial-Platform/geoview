import { memo, useMemo, useRef } from 'react';

import { useTheme } from '@mui/material/styles';

import { Box } from '@/ui';
import { Projection } from '@/geo/utils/projection';
import { NorthArrowIcon, NorthPoleIcon } from './north-arrow-icon';
import { getSxClasses } from './north-arrow-style';
import {
  useMapNorthArrowElement,
  useMapProjectionEPSG,
  useMapStoreActions,
} from '@/core/stores/store-interface-and-intial-values/map-state';

import { useManageArrow } from './hooks/useManageArrow';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { TIMEOUT } from '@/core/utils/constant';

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
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State (no useState for item used inside function only without rendering... use useRef)
  const northArrowRef = useRef<HTMLDivElement>(null);

  // Store
  const mapProjectionEPSG = useMapProjectionEPSG();
  const northArrowElement = useMapNorthArrowElement();
  const { rotationAngle, northOffset } = useManageArrow();

  /**
   * Checks whether the map projection supports a north arrow.
   */
  const memoIsValidProjection = useMemo(
    () => mapProjectionEPSG === Projection.PROJECTION_NAMES.LCC || mapProjectionEPSG === Projection.PROJECTION_NAMES.WM,
    [mapProjectionEPSG]
  );

  if (!memoIsValidProjection) return <Box />;

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
 * Creates a north pole flag marker icon.
 *
 * Memoized to prevent re-renders since the component has no props and relies entirely on store state.
 *
 * @returns The north pole marker component
 */
export const NorthPoleFlag = memo(function NorthPoleFlag(): JSX.Element {
  // State
  const northPoleId = `${useGeoViewMapId()}-northpole`;
  const northPoleRef = useRef<HTMLDivElement | null>(null);

  // Store
  const mapProjectionEPSG = useMapProjectionEPSG();
  const { setOverlayNorthMarkerRef } = useMapStoreActions();
  setTimeout(() => setOverlayNorthMarkerRef(northPoleRef.current as HTMLElement), TIMEOUT.deferExecution); // set marker reference

  const isVisible = mapProjectionEPSG === Projection.PROJECTION_NAMES.LCC;

  return (
    <Box ref={northPoleRef} id={northPoleId} style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
      <NorthPoleIcon />
    </Box>
  );
});
