import { useContext, useState } from 'react';

import makeStyles from '@mui/styles/makeStyles';

import { CollapseIcon, ExpandIcon, IconButton } from '../../../ui';

import { MapContext } from '../../app-start';
import { api } from '../../../app';

import { booleanPayload } from '../../../api/events/payloads/boolean-payload';
import { EVENT_NAMES } from '../../../api/events/event';

export const useStyles = makeStyles((theme) => ({
  expandbuttonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: `${theme.palette.primary.light}`,
    padding: `0px 5px`,
  },
  expandButtonText: {
    fontSize: `${theme.typography.fontSize}px !important`,
  },
}));

/**
 * Footerbar Expand Button component
 *
 * @returns {JSX.Element} the expand buttons
 */
export function FooterbarExpandButton(): JSX.Element {
  const [status, setStatus] = useState<boolean>(false);

  const classes = useStyles();

  const mapConfig = useContext(MapContext);
  const mapId = mapConfig.id;

  /**
   * Expand the footerbar
   */
  const expandFooterbar = () => {
    const footerBar = document.getElementById(`${mapId}-footerBar`);

    if (footerBar) {
      footerBar.style.transition = 'max-height 1s ease-in';
      footerBar.style.maxHeight = '100%';

      const ulElement = footerBar.querySelector('.ol-attribution ul') as HTMLElement;

      if (ulElement) {
        ulElement.style.width = '100%';
      }
    }

    setStatus(true);

    api.event.emit(booleanPayload(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE, mapId, true));
  };

  /**
   * Collapse footerbar
   */
  const collapseFooterbar = () => {
    const footerBar = document.getElementById(`${mapId}-footerBar`);

    if (footerBar) {
      const ulElement = footerBar.querySelector('.ol-attribution ul') as HTMLElement;

      if (ulElement) {
        ulElement.style.width = '0px';
      }

      footerBar.style.transition = 'max-height 300ms ease-out';
      footerBar.style.maxHeight = '20px';
    }

    setStatus(false);

    api.event.emit(booleanPayload(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE, mapId, false));
  };

  return (
    <IconButton className={`${classes.expandbuttonContainer}`} onClick={() => (status ? collapseFooterbar() : expandFooterbar())}>
      {status ? <ExpandIcon className={classes.expandButtonText} /> : <CollapseIcon className={classes.expandButtonText} />}
    </IconButton>
  );
}
