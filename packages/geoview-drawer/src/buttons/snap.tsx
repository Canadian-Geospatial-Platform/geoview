import { createSvgIcon } from '@mui/material/utils';
import { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions, useDrawerIsSnapping } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';

const snappingIconPath =
  'M 152.5,259.5 V 348.8 C 151.8,455.1 193.8,527.3 320,527.3 451.7,527.3 487.5,455.8 487.5,348.8 V 259.5 H 391.8 V 348.8 C 391.8,410.7 386.3,452 320,452 256.1,452 248.2,403.7 248.2,348.8 V 259.5 Z M 152.5,221.2 H 248.2 V 170.2 C 248.2,156.1 237.6,144.7 224.3,144.7 H 176.5 C 163.3,144.7 152.5,156.1 152.5,170.2 Z M 391.8,221.2 H 487.5 V 170.2 C 487.5,156.1 476.7,144.7 463.5,144.7 H 415.7 C 402.4,144.7 391.8,156.1 391.8,170.2 Z';

const SnappingIcon = createSvgIcon(
  <svg viewBox="96 96 448 480" xmlns="http://www.w3.org/200/svg">
    <path d={snappingIconPath} />
  </svg>,
  'SnappingIcon'
);

/**
 * Create a measure button to toggle measurement overlays on drawings
 *
 * @returns {JSX.Element} the created measurement button
 */
export default function Snapping(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/clear');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useMemo } = cgpv.reactUtilities.react;

  // Get store values
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const displayLanguage = useAppDisplayLanguage();
  const isSnapping = useDrawerIsSnapping();

  // Store actions
  const { toggleSnapping } = useDrawerActions();

  /**
   * Handles a click on the clear button
   */
  const handleToggleSnapping = (): void => {
    toggleSnapping();
  };

  return (
    <IconButton
      id="snap"
      tooltip={getLocalizedMessage(displayLanguage, 'drawer.toggleSnapping')}
      tooltipPlacement="left"
      onClick={handleToggleSnapping}
      className={isSnapping ? 'highlighted active' : ''}
      sx={sxClasses.navButton}
    >
      <SnappingIcon />
    </IconButton>
  );
}
