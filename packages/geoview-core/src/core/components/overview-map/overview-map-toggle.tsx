import { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { OverviewMap as OLOverviewMap } from 'ol/control';
import { useTranslation } from 'react-i18next';

import { ChevronLeftIcon, Tooltip } from '@/ui';
import { logger } from '@/core/utils/logger';
import { Box } from '@/ui/layout';
import { getSxClasses } from './overview-map-toggle-styles';

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
export function OverviewMapToggle(props: OverviewMapToggleProps): JSX.Element | null {
  const { overviewMap } = props;

  const { t } = useTranslation<string>();
  const tooltipAndAria = t('mapctrl.overviewmap.toggle')!;
  const sxClasses = useMemo(() => getSxClasses(), []);
  const [isExpanded, setIsExpanded] = useState(true);
  const [targetElement, setTargetElement] = useState<HTMLDivElement | null>(null);

  const handleClick = useCallback((): void => {
    const isCollapsed = overviewMap.getCollapsed();
    setIsExpanded(!isCollapsed);

    const overviewMapViewport = overviewMap.getOverviewMap().getTargetElement() as HTMLDivElement;

    if (overviewMapViewport) {
      if (!isCollapsed) {
        overviewMapViewport.style.width = '150px';
        overviewMapViewport.style.height = '150px';
      } else {
        overviewMapViewport.style.width = '40px';
        overviewMapViewport.style.height = '40px';
        overviewMapViewport.style.margin = '0px';
      }
    }
  }, [overviewMap]);

  useEffect(() => {
    logger.logTraceUseEffect('OVERVIEW-MAP-TOGGLE - mount');
    let isCleanedUp = false;

    const intervalId = setInterval(() => {
      if (isCleanedUp) return;
      const overviewMapElement = overviewMap.getOverviewMap().getTargetElement();
      if (!overviewMapElement) return;

      const button = overviewMapElement.parentElement?.querySelector('button');
      if (!button) return;

      // Find the div inside the button
      const buttonDiv = button.querySelector('div');
      if (!buttonDiv) return;

      // Found the button, clear interval and set up events
      clearInterval(intervalId);
      button.setAttribute('aria-label', tooltipAndAria);
      button.addEventListener('click', handleClick);
      setTargetElement(buttonDiv);
    }, 100);

    // Cleanup function to remove event listener
    return (): void => {
      isCleanedUp = true;
      clearInterval(intervalId);
      const button = targetElement?.parentElement;
      if (button) {
        button.removeEventListener('click', handleClick);
      }
    };
  }, [handleClick, tooltipAndAria, overviewMap, targetElement]);

  if (!targetElement) return null;

  return createPortal(
    <Tooltip title={tooltipAndAria}>
      <Box sx={sxClasses.toggleBtnContainer}>
        <Box
          component="div"
          sx={sxClasses.toggleBtn}
          className={isExpanded ? `minimapOpen` : `minimapClosed`}
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
    </Tooltip>,
    targetElement
  );
}
