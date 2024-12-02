import { memo, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box } from '@/ui';

import { Attribution } from '@/core/components/attribution/attribution';
import { MousePosition } from '@/core/components/mouse-position/mouse-position';
import { Scale } from '@/core/components/scale/scale';
import { MapInfoExpandButton } from './map-info-expand-button';
import { MapInfoRotationButton } from './map-info-rotation-button';
import { MapInfoFixNorthSwitch } from './map-info-fixnorth-switch';
import { useMapInteraction } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useUIMapInfoExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
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
  zIndex: 200,
} as const;

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

  // Store
  const expanded = useUIMapInfoExpanded();
  const interaction = useMapInteraction(); // Static map, do not display mouse position or rotation controls
  const mapId = useGeoViewMapId(); // Element id for panel height (expanded)

  // Memoize values
  const containerStyles = useMemo(
    () => ({
      ...MAP_INFO_BASE_STYLES,
      height: expanded ? '6rem' : '3rem',
      background: theme.palette.geoViewColor.bgColor.dark[800],
      color: theme.palette.geoViewColor.bgColor.light[800],
    }),
    [expanded, theme.palette.geoViewColor.bgColor.dark, theme.palette.geoViewColor.bgColor.light]
  );

  return (
    <Box id={`${mapId}-mapInfo`} sx={containerStyles}>
      <MapInfoExpandButton />
      <Attribution />
      {interaction === 'dynamic' && (
        <>
          <div style={{ flexGrow: 1 }} />
          <MousePosition />
        </>
      )}
      <Scale />
      <div style={{ flexGrow: 1 }} />
      {interaction === 'dynamic' && (
        <>
          <MapInfoFixNorthSwitch />
          <MapInfoRotationButton />
        </>
      )}
    </Box>
  );
});
