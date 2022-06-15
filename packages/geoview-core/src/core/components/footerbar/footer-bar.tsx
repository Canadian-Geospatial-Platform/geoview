import { MutableRefObject, useContext, useEffect, useRef } from 'react';

import makeStyles from '@mui/styles/makeStyles';

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Attribution } from '../attribution/attribution';
import { MousePosition } from '../mouse-position/mouse-position';
import { Scale } from '../scale/scale';

import { MapContext } from '../../app-start';

import { TypeFooterbarProps } from '../../types/cgpv-types';

export const useStyles = makeStyles(() => ({
  footerBarContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '20px',
    backgroundColor: '#0000008f',
    backdropFilter: 'blur(5px)',
    pointerEvents: 'all',
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  mouseScaleControlsContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
}));

/**
 * Create a footerbar element that contains attribtuion, mouse position and scale
 *
 * @param {TypeFooterbarProps} props the footerbar properties
 * @returns {JSX.Element} the footerbar element
 */
export function Footerbar(props: TypeFooterbarProps): JSX.Element {
  const { attribution } = props;

  // const [attribution, setAttribution] = useState<string>('');

  const classes = useStyles();

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  const footerBarRef = useRef<HTMLDivElement>();

  const defaultTheme = useTheme();

  // if screen size is medium and up
  const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('sm'));

  useEffect(() => {
    // // listen to attribution update
    // api.event.on(
    //   EVENT_NAMES.ATTRIBUTION.EVENT_ATTRIBUTION_UPDATE,
    //   (payload) => {
    //     if (payloadIsAttribution(payload)) {
    //       if (payload.handlerName && payload.handlerName === mapId) {
    //         console.log(payload.attribution);
    //         setAttribution(payload.attribution);
    //       }
    //     }
    //   },
    //   mapId
    // );
  }, [mapId]);

  return (
    <div id="footerBar" className={`${classes.footerBarContainer}`} ref={footerBarRef as MutableRefObject<HTMLDivElement>}>
      {deviceSizeMedUp && <Attribution attribution={attribution} />}
      {/* <ScaleControl position="bottomright" imperial={false} /> */}
      <div id="mouseAndScaleControls" className={classes.mouseScaleControlsContainer}>
        {deviceSizeMedUp && <MousePosition id={mapId} />}
        <Scale />
      </div>
    </div>
  );
}
