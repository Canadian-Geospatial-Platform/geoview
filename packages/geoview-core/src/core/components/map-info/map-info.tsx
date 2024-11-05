import { useTheme } from '@mui/material/styles';

import { Box } from '@/ui';
import { Attribution } from '@/core/components/attribution/attribution';
import { MousePosition } from '@/core/components/mouse-position/mouse-position';
import { Scale } from '@/core/components/scale/scale';

import { MapInfoExpandButton } from './map-info-expand-button';
import { MapInfoRotationButton } from './map-info-rotation-button';
import { MapInfoFixNorthSwitch } from './map-info-fixnorth-switch';
// import { getSxClasses } from './map-info-style';
import { useMapInteraction } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useUIMapInfoExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

/**
 * Create a map information element that contains attribtuion, mouse position and scale
 *
 * @returns {JSX.Element} the map information element
 */
export function MapInfo(): JSX.Element {
  // Log
  logger.logTraceRender('components/map-info/map-info');

  const mapId = useGeoViewMapId();

  const theme = useTheme();

  // get store values
  const expanded = useUIMapInfoExpanded();

  // get value from the store
  // if map is static do not display mouse position or rotation controls
  const interaction = useMapInteraction();

  return (
    <Box
      id={`${mapId}-mapInfo`}
      sx={{
        display: 'flex',
        height: expanded ? '6rem' : '3rem',
        alignItems: 'center',
        transition: 'width 0.5s, height 0.5s',
        background: theme.palette.geoViewColor.bgColor.dark[800],
        color: theme.palette.geoViewColor.bgColor.light[800],
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        px: '1rem',
        zIndex: 200
      }}
    >
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
}
