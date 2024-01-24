import { MutableRefObject, useRef } from 'react';
import { useTheme } from '@mui/material/styles';

import { Box, Grid } from '@/ui';
import { Attribution } from '@/core/components/attribution/attribution';
import { MousePosition } from '@/core/components/mouse-position/mouse-position';
import { Scale } from '@/core/components/scale/scale';

import { FooterbarExpandButton } from './footer-bar-expand-button';
import { FooterbarRotationButton } from './footer-bar-rotation-button';
import { FooterbarFixNorthSwitch } from './footer-bar-fixnorth-switch';
import { sxClassesFooterBar } from './footer-bar-style';
import { useMapInteraction } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useUIFooterBarExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/app';
import { logger } from '@/core/utils/logger';

/**
 * Create a footer bar element that contains attribtuion, mouse position and scale
 *
 * @returns {JSX.Element} the footer bar element
 */
export function Footerbar(): JSX.Element {
  // Log
  logger.logTraceRender('components/footer-bar/footer-bar');

  const mapId = useGeoViewMapId();

  const theme = useTheme();

  // internal state
  const footerBarRef = useRef<HTMLDivElement>();

  // get store values
  const expanded = useUIFooterBarExpanded();

  // get value from the store
  // if map is static do not display mouse position or rotation controls
  const interaction = useMapInteraction();

  return (
    <Box id={`${mapId}-footerBar`} sx={sxClassesFooterBar.footerBarContainer} ref={footerBarRef as MutableRefObject<HTMLDivElement>}>
      <FooterbarExpandButton />
      <Grid container justifyContent="space-between">
        <Grid item md={1}>
          <Attribution />
        </Grid>

        <Grid container item md={11} spacing={2}>
          <Grid
            container
            justifyContent="flex-end"
            sx={{
              [theme.breakpoints.down('md')]: {
                marginTop: '-32px',
              },
            }}
          >
            <Grid item md={10}>
              <Box id="mouseAndScaleControls" sx={sxClassesFooterBar.mouseScaleControlsContainer}>
                {interaction === 'dynamic' && <MousePosition />}
                <Scale />
              </Box>
            </Grid>
            {interaction === 'dynamic' && (
              <Grid item md={2}>
                <Box
                  sx={{
                    ...sxClassesFooterBar.rotationControlsContainer,
                    marginTop: !expanded ? '5px' : '10px',
                    [theme.breakpoints.down('md')]: {
                      marginTop: expanded ? '10px' : 'none',
                    },
                  }}
                >
                  <FooterbarRotationButton />
                  <FooterbarFixNorthSwitch />
                </Box>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
