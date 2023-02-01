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

const useStyles = makeStyles(() => ({
  footerBarContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxHeight: '34px',
    minHeight: '34px',
    backdropFilter: 'blur(5px)',
    backgroundColor: '#000000aa',
    pointerEvents: 'all',
    position: 'absolute',
    left: 0,
    bottom: 0,
    gap: 0.5,
  },
  mouseScaleControlsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    '& button': {
      cursor: 'pointer',
      margin: 'auto',
    },
  },
  rotationControlsContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: 20,
    alignItems: 'flex-end',
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

  const { mapId, interaction } = mapConfig;

  const footerBarRef = useRef<HTMLDivElement>();

  const defaultTheme = useTheme();

  // if screen size is medium and up
  const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('sm'));
  // If map is static do not display mouse position or rotation controls
  const mapIsDynamic = interaction === 'dynamic';

  return (
    <div id={`${mapId}-footerBar`} className={`${classes.footerBarContainer}`} ref={footerBarRef as MutableRefObject<HTMLDivElement>}>
      <FooterbarExpandButton />
      {deviceSizeMedUp && <Attribution />}
      <div id="mouseAndScaleControls" className={classes.mouseScaleControlsContainer}>
        {deviceSizeMedUp && mapIsDynamic && <MousePosition mousePositionMapId={mapId} />}
        <Scale />
      </div>
      {mapIsDynamic && (
        <div className={classes.rotationControlsContainer}>
          <FooterbarRotationButton />
          <FooterbarFixNorthSwitch />
        </div>
      )}
    </div>
  );
}
