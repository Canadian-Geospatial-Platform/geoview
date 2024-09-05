import { MutableRefObject, useRef } from 'react';
import { useTheme } from '@mui/material/styles';

import { Box, Grid } from '@/ui';
import { Attribution } from '@/core/components/attribution/attribution';
import { MousePosition } from '@/core/components/mouse-position/mouse-position';
import { Scale } from '@/core/components/scale/scale';

import { MapInfoExpandButton } from './map-info-expand-button';
import { MapInfoRotationButton } from './map-info-rotation-button';
import { MapInfoFixNorthSwitch } from './map-info-fixnorth-switch';
import { getSxClasses } from './map-info-style';
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
  const sxClasses = getSxClasses(theme);

  // internal state
  const mapInfoRef = useRef<HTMLDivElement>();

  // get store values
  const expanded = useUIMapInfoExpanded();

  // get value from the store
  // if map is static do not display mouse position or rotation controls
  const interaction = useMapInteraction();

  return (
    <Box
      id={`${mapId}-mapInfo`}
      className={`interaction-${interaction}`}
      sx={sxClasses.mapInfoContainer}
      ref={mapInfoRef as MutableRefObject<HTMLDivElement>}
    >
      {interaction === 'dynamic' && <MapInfoExpandButton />}
      <Grid container justifyContent="space-between" size={12}>
        {interaction === 'dynamic' && (
          <Grid size={{ md: 1 }}>
            <Attribution />
          </Grid>
        )}

        <Grid container spacing={2} size={{ md: interaction === 'dynamic' ? 11 : 12 }}>
          <Grid
            container
            sx={{
              justifyContent: 'flexEnd',
              flexWrap: 'nowrap',
              width: '100%',
            }}
          >
            <Grid size={{ md: interaction === 'dynamic' ? 11 : 12 }}>
              <Box id="mouseAndScaleControls" sx={sxClasses.mouseScaleControlsContainer}>
                {interaction === 'dynamic' && <MousePosition />}
                <Scale />
              </Box>
            </Grid>
            {interaction === 'dynamic' && (
              <Grid size={{ md: 2 }}>
                <Box
                  sx={{
                    ...sxClasses.rotationControlsContainer,
                    marginTop: !expanded ? '5px' : '10px',
                    [theme.breakpoints.down('md')]: {
                      marginTop: expanded ? '10px' : 'none',
                    },
                  }}
                >
                  <MapInfoRotationButton />
                  <MapInfoFixNorthSwitch />
                </Box>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
