import { useEffect, useRef, useState } from 'react';

import { OverviewMap as OLOverviewMap } from 'ol/control';
import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';

import { ChevronLeftIcon, Tooltip } from '@/ui';
import { logger } from '@/core/utils/logger';
import { Box } from '@/ui/layout';

// TODO: We need to find solution to remove makeStyles with either plain css or material ui.
const useStyles = makeStyles(() => ({
  toggleBtn: {
    transform: 'rotate(45deg)',
    color: 'black',
    zIndex: 150,
    '&:hover': {
      cursor: 'pointer',
    },
  },
  toggleBtnContainer: {
    zIndex: 150,
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

  const { t } = useTranslation<string>();
  const tooltipAndAria = t('mapctrl.overviewmap.toggle')!;

  // internal state
  const [status, setStatus] = useState(true);
  const divRef = useRef<HTMLDivElement>(null);

  // TODO: Remove useStyle
  const classes = useStyles();

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('OVERVIEW-MAP-TOGGLE - mount');

    // get toggle icon element
    if (divRef && divRef.current) {
      // get toggle button
      const button = (divRef.current as HTMLElement).closest('button') as HTMLButtonElement;

      if (button) {
        button.setAttribute('aria-label', tooltipAndAria);
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
    <Tooltip title={tooltipAndAria}>
      <Box ref={divRef} className={classes.toggleBtnContainer}>
        <Box
          component="div"
          className={`${classes.toggleBtn} ${!status ? classes.minimapOpen : classes.minimapClosed}`}
          style={{
            margin: 0,
            padding: 0,
            height: 'initial',
            minWidth: 'initial',
          }}
        >
          <ChevronLeftIcon />
        </Box>
      </Box>
    </Tooltip>
  );
}
