import { MutableRefObject, useContext, useRef } from 'react';

import makeStyles from '@mui/styles/makeStyles';

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Attribution } from '../attribution/attribution';
import { MousePosition } from '../mouse-position/mouse-position';
import { Scale } from '../scale/scale';

import { MapContext } from '../../app-start';
import { FooterbarExpandButton } from './footer-bar-expand-button';
import { FooterbarRotationButton } from './footer-bar-rotation-button';
import { FooterbarFixNorthSwitch } from './footer-bar-fixnorth-switch';
import { FooterBarExportPngButton } from './footer-bar-exportpng-button';

const useStyles = makeStyles((theme) => ({
  footerBarContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxHeight: '25px',
    minHeight: '25px',
    backdropFilter: 'blur(5px)',
    backgroundColor: '#000000aa',
    pointerEvents: 'all',
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  mouseScaleControlsContainer: {
    display: 'flex',
    flexDirection: 'row',
    padding: '5px',
    '& button': {
      cursor: 'pointer',
      margin: 'auto',
    },
  },
  rotationControlsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
}));

/**
 * Create a footer bar element that contains attribtuion, mouse position and scale
 *
 * @returns {JSX.Element} the footer bar element
 */
export function Footerbar(): JSX.Element {
  const classes = useStyles();

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  const footerBarRef = useRef<HTMLDivElement>();

  const defaultTheme = useTheme();

  // if screen size is medium and up
  const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('sm'));

  return (
    <div id={`${mapId}-footerBar`} className={`${classes.footerBarContainer}`} ref={footerBarRef as MutableRefObject<HTMLDivElement>}>
      <FooterbarExpandButton />
      {deviceSizeMedUp && <Attribution />}
      <div id="mouseAndScaleControls" className={classes.mouseScaleControlsContainer}>
        {deviceSizeMedUp && <MousePosition mousePositionMapId={mapId} />}
        <Scale />
      </div>
      <div>
        <FooterBarExportPngButton />
      </div>
      <div className={classes.rotationControlsContainer}>
        <FooterbarRotationButton />
        <FooterbarFixNorthSwitch />
      </div>
    </div>
  );
}
