import { useContext, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { OverviewMap as OLOverviewMap } from 'ol/control';

import makeStyles from '@mui/styles/makeStyles';
import { useTheme } from '@mui/material/styles';

import { ChevronLeftIcon, IconButton } from '../../../ui';

import { MapContext } from '../../app-start';

import { api } from '../../../app';

import { EVENT_NAMES } from '../../../api/events/event';

import { booleanPayload } from '../../types/cgpv-types';

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

interface OverviewMapToggleProps {
  overviewMap: OLOverviewMap;
}

export function OverviewMapToggle(props: OverviewMapToggleProps): JSX.Element {
  const { overviewMap } = props;

  const [status, setStatus] = useState(true);

  const divRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();

  const classes = useStyles();

  const theme = useTheme();

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  useEffect(() => {
    // listen to toggle event and change status of icon

    // get toggle icon element
    if (divRef && divRef.current) {
      // get toggle button
      const button = (divRef.current as HTMLElement).closest('button') as HTMLButtonElement;

      if (button) {
        // listen to toggle event
        button.addEventListener('click', (e) => {
          const isCollapsed = overviewMap.getCollapsed();

          setStatus(!isCollapsed);

          const overviewMapViewport = overviewMap.getOverviewMap().getTargetElement() as HTMLElement;

          if (overviewMapViewport) {
            if (isCollapsed) {
              overviewMapViewport.style.width = '32px';
              overviewMapViewport.style.height = '32px';
              overviewMapViewport.style.margin = '0px';
            } else {
              overviewMapViewport.style.width = '150px';
              overviewMapViewport.style.height = '150px';
            }
          }
        });
      }
    }
  }, []);

  return (
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
  );
}
