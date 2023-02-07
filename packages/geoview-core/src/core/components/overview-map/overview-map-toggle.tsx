import { useEffect, useRef, useState } from 'react';

import { OverviewMap as OLOverviewMap } from 'ol/control';
import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';

import { ChevronLeftIcon, Tooltip } from '../../../ui';

const useStyles = makeStyles((theme) => ({
  toggleBtn: {
    transform: 'rotate(45deg)',
    color: theme.palette.primary.contrastText,
    zIndex: theme.zIndex.tooltip,
    '&:hover': {
      cursor: 'pointer',
    },
  },
  toggleBtnContainer: {
    zIndex: theme.zIndex.tooltip,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  minimapOpen: {
    transform: 'rotate(-45deg)',
  },
  minimapClosed: {
    transform: 'rotate(135deg)',
  },
}));

/**
 * Properties for the overview map toggle
 */
interface OverviewMapToggleProps {
  /**
   * OpenLayers overview map control
   */
  overviewMap: OLOverviewMap;
}

/**
 * Create a toggle icon button
 *
 * @param {OverviewMapToggleProps} props overview map toggle properties
 * @returns {JSX.Element} returns the toggle icon button
 */
export function OverviewMapToggle(props: OverviewMapToggleProps): JSX.Element {
  const { overviewMap } = props;

  const [status, setStatus] = useState(true);
  const { t } = useTranslation<string>();

  const divRef = useRef<HTMLDivElement>(null);

  const classes = useStyles();

  useEffect(() => {
    // get toggle icon element
    if (divRef && divRef.current) {
      // get toggle button
      const button = (divRef.current as HTMLElement).closest('button') as HTMLButtonElement;

      if (button) {
        // listen to toggle event
        button.addEventListener('click', () => {
          const isCollapsed = overviewMap.getCollapsed();

          setStatus(!isCollapsed);

          const overviewMapViewport = overviewMap.getOverviewMap().getTargetElement() as HTMLElement;

          if (overviewMapViewport) {
            if (isCollapsed) {
              overviewMapViewport.style.width = '40px';
              overviewMapViewport.style.height = '40px';
              overviewMapViewport.style.margin = '0px';
            } else {
              overviewMapViewport.style.width = '150px';
              overviewMapViewport.style.height = '150px';
            }
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tooltip title={t('mapctrl.overviewmap.toggle')}>
      <div ref={divRef} className={`${classes.toggleBtnContainer}`}>
        <div
          className={`${classes.toggleBtn} ${!status ? classes.minimapOpen : classes.minimapClosed}`}
          style={{
            margin: 0,
            padding: 0,
            height: 'initial',
            minWidth: 'initial',
          }}
        >
          <ChevronLeftIcon />
        </div>
      </div>
    </Tooltip>
  );
}
