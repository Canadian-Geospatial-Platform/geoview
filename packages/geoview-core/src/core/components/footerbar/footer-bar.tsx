import { MutableRefObject, useContext, useRef } from 'react';

import makeStyles from '@mui/styles/makeStyles';

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Attribution } from '../attribution/attribution';
import { MousePosition } from '../mouse-position/mouse-position';
import { Scale } from '../scale/scale';

import { MapContext } from '../../app-start';
import { FooterbarExpandButton } from './footerbar-expand-button';
import { FooterbarRotationButton } from './footerbar-rotation-button';
import { FooterbarFixNorthSwitch } from './footerbar-fixnorth-switch';

const useStyles = makeStyles((theme) => ({
  footerBarContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    // height: '20px',
    maxHeight: '20px',
    minHeight: '20px',
    transition: 'max-height 2s ease-out',
    backgroundColor: '#0000008f',
    backdropFilter: 'blur(5px)',
    pointerEvents: 'all',
    position: 'absolute',
    left: 0,
    bottom: 0,
    zIndex: theme.zIndex.tooltip,
  },
  mouseScaleControlsContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  rotationControlsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
}));

/**
 * Create a footerbar element that contains attribtuion, mouse position and scale
 *
 * @returns {JSX.Element} the footerbar element
 */
export function Footerbar(): JSX.Element {
  const classes = useStyles();

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  const footerBarRef = useRef<HTMLDivElement>();

  const defaultTheme = useTheme();

  // if screen size is medium and up
  const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('sm'));

  return (
    <div id={`${mapId}-footerBar`} className={`${classes.footerBarContainer}`} ref={footerBarRef as MutableRefObject<HTMLDivElement>}>
      <FooterbarExpandButton />
      {deviceSizeMedUp && <Attribution />}
      <div id="mouseAndScaleControls" className={classes.mouseScaleControlsContainer}>
        {deviceSizeMedUp && <MousePosition id={mapId} />}
        <Scale />
      </div>
      <div className={classes.rotationControlsContainer}>
        <FooterbarRotationButton />
        <FooterbarFixNorthSwitch />
      </div>
    </div>
  );
}
