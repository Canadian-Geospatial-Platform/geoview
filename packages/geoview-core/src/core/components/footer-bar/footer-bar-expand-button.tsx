import { useContext } from 'react';

import { useStore } from 'zustand';
import { getGeoViewStore } from '@/core/stores/stores-managers';

import { ExpandMoreIcon, ExpandLessIcon, IconButton, Box } from '@/ui';
import { MapContext } from '@/core/app-start';

const sxClasses = {
  expandbuttonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'primary.light',
    height: '30px',
    width: '30px',
    marginLeft: '5px',
  },
};

/**
 * Footerbar Expand Button component
 *
 * @returns {JSX.Element} the expand buttons
 */
export function FooterbarExpandButton(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  // get the expand or collapse from expand button click
  const store = getGeoViewStore(mapId);
  const expanded = useStore(getGeoViewStore(mapId), (state) => state.footerBarState.expanded);

  /**
   * Expand the footer bar
   */
  const expandFooterbar = () => {
    const footerBar = document.getElementById(`${mapId}-footerBar`);
    if (footerBar) {
      footerBar.style.transition = 'max-height 300ms ease-in 0s';
      footerBar.style.maxHeight = '80px';
      footerBar.style.height = '80px';

      const ulElement = footerBar.querySelector('.ol-attribution ul') as HTMLElement;

      if (ulElement) {
        ulElement.style.width = '100%';
      }
    }

    // footerbar expanded
    store.setState({
      footerBarState: { ...store.getState().footerBarState, expanded: true },
    });
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

    // set footerbar collapsed
    store.setState({
      footerBarState: { ...store.getState().footerBarState, expanded: false },
    });
  };

  return (
    <Box>
      <IconButton sx={sxClasses.expandbuttonContainer} onClick={() => (expanded ? collapseFooterbar() : expandFooterbar())}>
        {expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
      </IconButton>
    </Box>
  );
}
