import React, { createElement, ReactNode, useCallback } from 'react';
import { useDrawerStyle, useDrawerActions } from 'geoview-core/src/core/stores/store-interface-and-intial-values/drawer-state';
import { useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { logger } from 'geoview-core/src/core/utils/logger';

import NavbarPanelButton from 'geoview-core/src/core/components/nav-bar/nav-bar-panel-button';
import { PaletteIcon } from 'geoview-core/src/ui/icons';
import { TypePanelProps } from 'geoview-core/src/ui/panel/panel-types';
import { IconButtonPropsExtend } from 'geoview-core/src/ui/icon-button/icon-button';
import { Box, Typography } from 'geoview-core/src/ui';

/**
 * Create a style button with a panel to customize drawing styles
 * @returns {JSX.Element} the created style button with panel
 */
export default function Style(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/style');

  // Get store values
  const style = useDrawerStyle();
  const displayLanguage = useAppDisplayLanguage();

  // Store actions
  const { setFillColor, setStrokeColor, setStrokeWidth } = useDrawerActions();

  const handleFillColorChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setFillColor(event.target.value);
    },
    [setFillColor]
  );

  const handleStrokeColorChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setStrokeColor(event.target.value);
    },
    [setStrokeColor]
  );

  const handleStrokeWidthChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const width = parseInt(event.target.value as string, 10);
      if (Number.isNaN(width)) return;
      setStrokeWidth(width);
    },
    [setStrokeWidth]
  );

  /**
   * Render style controls in navbar panel
   * @returns ReactNode
   */
  const renderStyleControls = (): ReactNode => {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">{getLocalizedMessage(displayLanguage, 'drawer.fillColour')}</Typography>
          <input type="color" value={style.fillColor} onChange={(e) => handleFillColorChange(e)} />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">{getLocalizedMessage(displayLanguage, 'drawer.strokeColour')}</Typography>
          <input type="color" value={style.strokeColor} onChange={(e) => handleStrokeColorChange(e)} />
        </Box>

        <Box>
          <Typography variant="subtitle2">{getLocalizedMessage(displayLanguage, 'drawer.strokeWidth')}</Typography>
          <input type="number" value={style.strokeWidth} min="0" max="10" onChange={(e) => handleStrokeWidthChange(e)} />
        </Box>
      </Box>
    );
  };

  // Set up props for nav bar panel button
  const button: IconButtonPropsExtend = {
    // id: 'drawer-style',
    tooltip: 'drawer.style',
    children: createElement(PaletteIcon),
    tooltipPlacement: 'right',
    // visible: true,
  };

  const panel: TypePanelProps = {
    title: 'drawer.style',
    icon: createElement(PaletteIcon),
    content: renderStyleControls(),
    width: 300,
  };

  return <NavbarPanelButton buttonPanel={{ buttonPanelId: 'drawerStyle', button, panel }} />;
}
