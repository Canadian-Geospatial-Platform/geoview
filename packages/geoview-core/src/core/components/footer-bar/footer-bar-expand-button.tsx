import { useContext, useState } from 'react';

import { ExpandMoreIcon, ExpandLessIcon, IconButton } from '../../../ui';
import { MapContext } from '../../app-start';
import { api } from '../../../app';

import { booleanPayload } from '../../../api/events/payloads/boolean-payload';
import { EVENT_NAMES } from '../../../api/events/event-types';

const sxClasses = {
  expandbuttonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'primary.light',
    height: '25px',
    width: '25px',
  },
};

/**
 * Footerbar Expand Button component
 *
 * @returns {JSX.Element} the expand buttons
 */
export function FooterbarExpandButton(): JSX.Element {
  const [status, setStatus] = useState<boolean>(false);

  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  /**
   * Expand the footer bar
   */
  const expandFooterbar = () => {
    const footerBar = document.getElementById(`${mapId}-footerBar`);
    if (footerBar) {
      footerBar.style.transition = 'max-height 300ms ease-in';
      footerBar.style.maxHeight = '55px';
      footerBar.style.height = '55px';

      const ulElement = footerBar.querySelector('.ol-attribution ul') as HTMLElement;

      if (ulElement) {
        ulElement.style.width = '100%';
      }
    }

    setStatus(true);

    api.event.emit(booleanPayload(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE, mapId, true));
  };

  /**
   * Collapse footer bar
   */
  const collapseFooterbar = () => {
    const footerBar = document.getElementById(`${mapId}-footerBar`);

    if (footerBar) {
      const ulElement = footerBar.querySelector('.ol-attribution ul') as HTMLElement;

      if (ulElement) {
        ulElement.style.width = '0px';
      }

      footerBar.style.transition = 'max-height 300ms ease-out';
      footerBar.style.maxHeight = '25px';
    }

    setStatus(false);

    api.event.emit(booleanPayload(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE, mapId, false));
  };

  return (
    <IconButton sx={sxClasses.expandbuttonContainer} onClick={() => (status ? collapseFooterbar() : expandFooterbar())}>
      {status ? <ExpandMoreIcon /> : <ExpandLessIcon />}
    </IconButton>
  );
}
