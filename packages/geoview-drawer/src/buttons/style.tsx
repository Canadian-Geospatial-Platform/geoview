import { TypeWindow } from 'geoview-core';
import { ChangeEvent } from 'react';
import { useDrawerStyle, useDrawerActions } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { logger } from 'geoview-core/core/utils/logger';

export function StyleButton(): JSX.Element {
  const { PaletteIcon } = (window as TypeWindow).cgpv.ui.elements;

  return <PaletteIcon />;
}

/**
 * Create a style button with a panel to customize drawing styles
 * @returns {JSX.Element} the created style button with panel
 */
export function StylePanel(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/style');

  const { cgpv } = window as TypeWindow;
  const { ui, reactUtilities } = cgpv;
  const { useCallback } = reactUtilities.react;

  // Components
  const { List, ListItem, Typography } = ui.elements;

  // Get store values
  const style = useDrawerStyle();
  const displayLanguage = useAppDisplayLanguage();

  // Store actions
  const { setFillColor, setStrokeColor, setStrokeWidth } = useDrawerActions();

  const handleFillColorChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setFillColor(event.target.value);
    },
    [setFillColor]
  );

  const handleStrokeColorChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setStrokeColor(event.target.value);
    },
    [setStrokeColor]
  );

  const handleStrokeWidthChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const width = parseInt(event.target.value, 10);
      if (Number.isNaN(width)) return;
      setStrokeWidth(width);
    },
    [setStrokeWidth]
  );

  /**
   * Render style controls in navbar panel
   * @returns ReactNode
   */
  return (
    <List sx={{ p: 2 }}>
      <ListItem sx={{ mb: 2 }}>
        <Typography variant="subtitle2">{getLocalizedMessage(displayLanguage, 'drawer.fillColour')}</Typography>
        <input type="color" value={style.fillColor} onChange={handleFillColorChange} />
      </ListItem>

      <ListItem sx={{ mb: 2 }}>
        <Typography variant="subtitle2">{getLocalizedMessage(displayLanguage, 'drawer.strokeColour')}</Typography>
        <input type="color" value={style.strokeColor} onChange={handleStrokeColorChange} />
      </ListItem>

      <ListItem>
        <Typography variant="subtitle2">{getLocalizedMessage(displayLanguage, 'drawer.strokeWidth')}</Typography>
        <input type="number" value={style.strokeWidth} min="0" max="10" onChange={handleStrokeWidthChange} />
      </ListItem>
    </List>
  );
}
