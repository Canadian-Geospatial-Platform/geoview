import { MutableRefObject, useContext, useRef } from 'react';

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Box } from '@/ui';
import { Attribution } from '@/core/components/attribution/attribution';
import { MousePosition } from '@/core/components/mouse-position/mouse-position';
import { Scale } from '@/core/components/scale/scale';

import { MapContext } from '@/core/app-start';
import { FooterbarExpandButton } from './footer-bar-expand-button';
import { FooterbarRotationButton } from './footer-bar-rotation-button';
import { FooterbarFixNorthSwitch } from './footer-bar-fixnorth-switch';
import { sxClassesFooterBar } from './footer-bar-style';
import { useMapInteraction } from '@/core/stores/store-interface-and-intial-values/map-state';

/**
 * Create a footer bar element that contains attribtuion, mouse position and scale
 *
 * @returns {JSX.Element} the footer bar element
 */
export function Footerbar(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const footerBarRef = useRef<HTMLDivElement>();

  const theme = useTheme();

  // get value from the store
  // if map is static do not display mouse position or rotation controls
  const interaction = useMapInteraction();

  // if screen size is medium and up
  const deviceSizeMedUp = useMediaQuery(theme.breakpoints.up('sm'));

  return (
    <Box id={`${mapId}-footerBar`} sx={sxClassesFooterBar.footerBarContainer} ref={footerBarRef as MutableRefObject<HTMLDivElement>}>
      <FooterbarExpandButton />
      {deviceSizeMedUp && <Attribution />}
      <Box id="mouseAndScaleControls" sx={sxClassesFooterBar.mouseScaleControlsContainer}>
        {deviceSizeMedUp && interaction === 'dynamic' && <MousePosition />}
        <Scale />
      </Box>
      {interaction === 'dynamic' && (
        <Box sx={sxClassesFooterBar.rotationControlsContainer}>
          <FooterbarRotationButton />
          <FooterbarFixNorthSwitch />
        </Box>
      )}
    </Box>
  );
}
