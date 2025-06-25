import { TypeWindow } from 'geoview-core';
import { MuiColorInput } from 'mui-color-input';
import { ChangeEvent, useState } from 'react';
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
  const { List, ListItem, Typography, TextField } = ui.elements;

  // Styles
  const sxClasses = {
    listItem: {
      mb: 2,
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    label: {
      mb: 1,
    },
    input: {
      width: '100%',
    },
    numberInput: {
      width: '100%',
      padding: '8px',
      border: '1px solid #ccc',
      borderRadius: '4px',
    },
  };

  // Get store values
  const style = useDrawerStyle();
  const displayLanguage = useAppDisplayLanguage();

  // Local state for color inputs
  const [localFillColor, setLocalFillColor] = useState(style.fillColor);
  const [localStrokeColor, setLocalStrokeColor] = useState(style.strokeColor);

  // Store actions
  const { setFillColor, setStrokeColor, setStrokeWidth } = useDrawerActions();

  const handleFillColorChange = useCallback((newFillColor: string): void => {
    setLocalFillColor(newFillColor);
  }, []);

  const handleFillColorClose = useCallback((): void => {
    setFillColor(localFillColor);
  }, [setFillColor, localFillColor]);

  const handleStrokeColorChange = useCallback((newStrokeColor: string): void => {
    setLocalStrokeColor(newStrokeColor);
  }, []);

  const handleStrokeColorClose = useCallback((): void => {
    setStrokeColor(localStrokeColor);
  }, [setStrokeColor, localStrokeColor]);

  const handleStrokeWidthChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const width = parseFloat(event.target.value);
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
      <ListItem sx={sxClasses.listItem}>
        <Typography variant="subtitle2" sx={sxClasses.label}>
          {getLocalizedMessage(displayLanguage, 'drawer.fillColour')}
        </Typography>
        <MuiColorInput
          value={localFillColor}
          onChange={handleFillColorChange}
          onBlur={handleFillColorClose}
          PopoverProps={{ onClose: handleFillColorClose }}
          sx={sxClasses.input}
        />
      </ListItem>

      <ListItem sx={sxClasses.listItem}>
        <Typography variant="subtitle2" sx={sxClasses.label}>
          {getLocalizedMessage(displayLanguage, 'drawer.strokeColour')}
        </Typography>
        <MuiColorInput
          value={localStrokeColor}
          onChange={handleStrokeColorChange}
          onBlur={handleStrokeColorClose}
          PopoverProps={{ onClose: handleStrokeColorClose }}
          sx={sxClasses.input}
        />
      </ListItem>

      <ListItem sx={sxClasses.listItem}>
        <Typography variant="subtitle2" sx={sxClasses.label}>
          {getLocalizedMessage(displayLanguage, 'drawer.strokeWidth')}
        </Typography>
        <TextField
          value={style.strokeWidth}
          onChange={handleStrokeWidthChange}
          sx={sxClasses.input}
          slotProps={{
            input: {
              type: 'number',
              inputProps: { min: 0, max: 10, step: 0.1 },
            },
          }}
        />
      </ListItem>
    </List>
  );
}
