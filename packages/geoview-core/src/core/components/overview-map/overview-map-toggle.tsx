import { useEffect, useRef, useState } from 'react';

import { OverviewMap as OLOverviewMap } from 'ol/control';
import { useTranslation } from 'react-i18next';

import { ChevronLeftIcon, Tooltip } from '@/ui';
import { logger } from '@/core/utils/logger';
import { Box } from '@/ui/layout';
import { sxClasses } from './overview-map-toggle-styles';

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
      <Box ref={divRef} sx={sxClasses.toggleBtnContainer}>
        <Box
          component="div"
          sx={sxClasses.toggleBtn}
          className={status ? `minimapOpen` : `minimapClosed`}
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
