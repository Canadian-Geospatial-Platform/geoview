import { useEffect } from 'react';

import { ExpandMoreIcon, ExpandLessIcon, IconButton, Box } from '@/ui';
import { sxClassesExportButton } from './footer-bar-style';
import { useUIStoreActions, useUIFooterBarExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/app';
import { logger } from '@/core/utils/logger';

/**
 * Footerbar Expand Button component
 *
 * @returns {JSX.Element} the expand buttons
 */
export function FooterbarExpandButton(): JSX.Element {
  // get the expand or collapse from expand button click
  const mapId = useGeoViewMapId();
  const expanded = useUIFooterBarExpanded();
  const { setFooterBarExpanded } = useUIStoreActions();

  const handleTransitionEnd = () => {
    setFooterBarExpanded(true);
  };

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

      // event listener for transitionend
      footerBar.addEventListener('transitionend', handleTransitionEnd, { once: true });
    }
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

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-BAR-EXPAND-BUTTON - mount');

    return () => {
      const footerBar = document.getElementById(`${mapId}-footerBar`);
      if (footerBar) {
        footerBar.removeEventListener('transitionend', handleTransitionEnd);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <IconButton sx={sxClassesExportButton.expandbuttonContainer} onClick={() => (expanded ? collapseFooterbar() : expandFooterbar())}>
        {expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
      </IconButton>
    </Box>
  );
}
