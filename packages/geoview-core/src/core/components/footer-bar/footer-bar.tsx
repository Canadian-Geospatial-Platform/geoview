import { MutableRefObject, useContext, useRef } from 'react';

import { useStore } from 'zustand';

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { Box } from '@/ui';

import { Attribution } from '../attribution/attribution';
import { MousePosition } from '../mouse-position/mouse-position';
import { Scale } from '../scale/scale';

import { MapContext } from '@/core/app-start';
import { FooterbarExpandButton } from './footer-bar-expand-button';
import { FooterbarRotationButton } from './footer-bar-rotation-button';
import { FooterbarFixNorthSwitch } from './footer-bar-fixnorth-switch';
import { sxClassesFooterBar } from './footer-bar-style';

/**
 * Create a footer bar element that contains attribtuion, mouse position and scale
 *
 * @returns {JSX.Element} the footer bar element
 */
export function Footerbar(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const footerBarRef = useRef<HTMLDivElement>();

  const defaultTheme = useTheme();

  // get value from the store
  // if map is static do not display mouse position or rotation controls
  const interaction = useStore(getGeoViewStore(mapId), (state) => state.mapState.interaction);

  // if screen size is medium and up
  const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('sm'));

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
