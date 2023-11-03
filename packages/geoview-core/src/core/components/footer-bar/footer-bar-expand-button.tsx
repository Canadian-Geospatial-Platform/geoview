import { useContext } from 'react';

import { ExpandMoreIcon, ExpandLessIcon, IconButton, Box } from '@/ui';
import { MapContext } from '@/core/app-start';
import { sxClassesExportButton } from './footer-bar-style';
import { useUIStoreActions, useUIFooterBarExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';

/**
 * Footerbar Expand Button component
 *
 * @returns {JSX.Element} the expand buttons
 */
export function FooterbarExpandButton(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  // get the expand or collapse from expand button click
  const expanded = useUIFooterBarExpanded();
  const { setFooterBarExpanded } = useUIStoreActions();

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
    setFooterBarExpanded(true);
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
    setFooterBarExpanded(false);
  };

  return (
    <Box>
      <IconButton sx={sxClassesExportButton.expandbuttonContainer} onClick={() => (expanded ? collapseFooterbar() : expandFooterbar())}>
        {expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
      </IconButton>
    </Box>
  );
}
