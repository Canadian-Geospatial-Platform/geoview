import type { TypeWindow } from 'geoview-core';
import { MuiColorInput } from 'mui-color-input';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import {
  useDrawerStyle,
  useDrawerActiveGeom,
  useDrawerActions,
  useDrawerSelectedDrawingType,
} from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { logger } from 'geoview-core/core/utils/logger';

import { FONT_OPTIONS, DEFAULT_FONT, loadGoogleFont } from '../utils/fonts';

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

/**
 * Renders the style button icon.
 *
 * @returns The palette icon element
 */
export function StyleButton(): JSX.Element {
  const { PaletteIcon } = (window as TypeWindow).cgpv.ui.elements;

  return <PaletteIcon />;
}

/**
 * Creates a style panel to customize drawing styles.
 *
 * @returns The style panel element
 */
export function StylePanel(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/style');

  const { cgpv } = window as TypeWindow;
  const { ui, reactUtilities } = cgpv;
  const { useCallback, useEffect, useMemo } = reactUtilities.react;

  // Components
  const { Box, List, ListItem, Typography, TextField, IconButton, FormatBoldIcon, FormatItalicIcon } = ui.elements;

  // Get store values
  const style = useDrawerStyle();
  const activeGeom = useDrawerActiveGeom();
  const selectedDrawingType = useDrawerSelectedDrawingType();
  const displayLanguage = useAppDisplayLanguage();

  const memoCurrentGeomType = useMemo(() => {
    return selectedDrawingType ?? activeGeom;
  }, [activeGeom, selectedDrawingType]);

  // Local state for color inputs
  const [localFillColor, setLocalFillColor] = useState(style.fillColor);
  const [localStrokeColor, setLocalStrokeColor] = useState(style.strokeColor);
  const [localTextColor, setLocalTextColor] = useState(style.textColor || '#000000');
  const [localTextHaloColor, setLocalTextHaloColor] = useState(style.textHaloColor || 'rgba(255,255,255,0.8)');

  // Store actions
  const {
    setFillColor,
    setStrokeColor,
    setStrokeWidth,
    setIconSize,
    setTextValue,
    setTextSize,
    setTextHaloColor,
    setTextHaloWidth,
    setTextColor,
    setTextBold,
    setTextItalic,
    setTextFont,
  } = useDrawerActions();

  // #region Handlers

  /**
   * Handles when the user changes the text value
   */
  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setTextValue(event.target.value);
    },
    [setTextValue]
  );

  /**
   * Handles when the user changes the font
   */
  const handleFontChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const selectedFont = event.target.value;
      const fontOption = FONT_OPTIONS.find((f) => f.value === selectedFont);

      // Load Google Font if needed
      if (fontOption?.isGoogleFont) {
        loadGoogleFont(fontOption.name);
      }

      setTextFont(selectedFont);
    },
    [setTextFont]
  );

  /**
   * Handles when the user changes the text size
   */
  const handleTextSizeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const size = parseInt(event.target.value, 10);
      if (!Number.isNaN(size)) setTextSize(size);
    },
    [setTextSize]
  );

  /**
   * Handles when the user changes the text halo width
   */
  const handleTextHaloWidthChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const size = parseInt(event.target.value, 10);
      if (!Number.isNaN(size)) setTextHaloWidth(size);
    },
    [setTextHaloWidth]
  );

  /**
   * Handles when the user changes the fill color
   */
  const handleFillColorChange = useCallback((newFillColor: string): void => {
    setLocalFillColor(newFillColor);
  }, []);

  /**
   * Handles when the fill color picker closes
   */
  const handleFillColorClose = useCallback((): void => {
    setFillColor(localFillColor);
  }, [setFillColor, localFillColor]);

  /**
   * Handles when the user changes the stroke color
   */
  const handleStrokeColorChange = useCallback((newStrokeColor: string): void => {
    setLocalStrokeColor(newStrokeColor);
  }, []);

  /**
   * Handles when the stroke color picker closes
   */
  const handleStrokeColorClose = useCallback((): void => {
    setStrokeColor(localStrokeColor);
  }, [setStrokeColor, localStrokeColor]);

  /**
   * Handles when the user changes the icon size
   */
  const handleIconSizeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const size = parseInt(event.target.value, 10);
      if (!Number.isNaN(size)) setIconSize(size);
    },
    [setIconSize]
  );

  /**
   * Handles when the user changes the text color
   */
  const handleTextColorChange = useCallback((newColor: string): void => {
    setLocalTextColor(newColor);
  }, []);

  /**
   * Handles when the text color picker closes
   */
  const handleTextColorClose = useCallback((): void => {
    setTextColor(localTextColor);
  }, [setTextColor, localTextColor]);

  /**
   * Handles when the user changes the text halo color
   */
  const handleTextHaloColorChange = useCallback((newColor: string): void => {
    setLocalTextHaloColor(newColor);
  }, []);

  /**
   * Handles when the text halo color picker closes
   */
  const handleTextHaloColorClose = useCallback((): void => {
    setTextHaloColor(localTextHaloColor);
  }, [setTextHaloColor, localTextHaloColor]);

  /**
   * Handles when the user changes the stroke width
   */
  const handleStrokeWidthChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const width = parseFloat(event.target.value);
      if (Number.isNaN(width)) return;
      setStrokeWidth(width);
    },
    [setStrokeWidth]
  );

  /**
   * Handles when the user toggles bold formatting
   */
  const handleToggleBold = useCallback((): void => {
    setTextBold(!style.textBold);
  }, [setTextBold, style.textBold]);

  /**
   * Handles when the user toggles italic formatting
   */
  const handleToggleItalic = useCallback((): void => {
    setTextItalic(!style.textItalic);
  }, [setTextItalic, style.textItalic]);

  // #endregion

  // Add close button to MUIColorInputs
  useEffect(() => {
    logger.logTraceUseEffect('STYLE PANEL - Color picker close button setup', displayLanguage);

    const addCloseButtons = (): void => {
      // Find all color picker popovers
      const popovers = document.querySelectorAll('.MuiColorInput-PopoverBody');

      popovers.forEach((popover) => {
        // Check if we already added a close button
        if (popover.parentElement?.querySelector('.color-picker-close-btn')) return;

        // Create header div
        const header = document.createElement('div');
        header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0px 0px 8px 8px;
        font-size: 14px;
        font-weight: 500;
      `;
        header.textContent = getLocalizedMessage(displayLanguage, 'drawer.colourPicker');

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'color-picker-close-btn';
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

        closeBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Find the specific popover and close it by clicking outside
          const popoverRoot = popover.closest('.MuiPopover-root');
          if (popoverRoot) {
            const backdrop = popoverRoot.querySelector('.MuiBackdrop-root');
            if (backdrop) {
              (backdrop as HTMLElement).click();
            }
          }
        };

        header.appendChild(closeBtn);

        // Insert header before the popover body
        if (popover.parentElement) {
          popover.parentElement.insertBefore(header, popover);
        }
      });
    };

    // Use MutationObserver to detect when popovers are added
    const observer = new MutationObserver(addCloseButtons);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [displayLanguage]);

  // Preload all Google Fonts
  useEffect(() => {
    logger.logTraceUseEffect('STYLE PANEL - Preload Google Fonts');

    FONT_OPTIONS.forEach((font) => {
      if (font.isGoogleFont) {
        loadGoogleFont(font.name);
      }
    });
  }, []);

  return (
    <List sx={{ p: 2 }}>
      {/* Text-specific controls */}
      {memoCurrentGeomType === 'Text' && (
        <>
          <ListItem sx={sxClasses.listItem}>
            <Typography variant="subtitle2" sx={sxClasses.label}>
              {getLocalizedMessage(displayLanguage, 'drawer.text')}
            </Typography>
            <TextField value={style.text || ''} onChange={handleTextChange} sx={sxClasses.input} placeholder="Enter text" multiline />
          </ListItem>

          <ListItem sx={sxClasses.listItem}>
            <Typography variant="subtitle2" sx={sxClasses.label}>
              {getLocalizedMessage(displayLanguage, 'drawer.textFont')}
            </Typography>
            <TextField
              select
              value={style.textFont || DEFAULT_FONT}
              onChange={handleFontChange}
              sx={{
                ...sxClasses.input,
                '& .MuiNativeSelect-select': {
                  fontFamily: style.textFont || DEFAULT_FONT,
                },
              }}
              slotProps={{
                select: {
                  native: true,
                },
              }}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.name}
                </option>
              ))}
            </TextField>
          </ListItem>

          {/* Text Color and Size in one row */}
          <ListItem sx={sxClasses.listItem}>
            <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={sxClasses.label}>
                  {getLocalizedMessage(displayLanguage, 'drawer.textColour')}
                </Typography>
                <MuiColorInput
                  value={localTextColor}
                  onChange={handleTextColorChange}
                  onBlur={handleTextColorClose}
                  sx={{ width: '100%' }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={sxClasses.label}>
                  {getLocalizedMessage(displayLanguage, 'drawer.textSize')}
                </Typography>
                <TextField
                  value={style.textSize || 14}
                  onChange={handleTextSizeChange}
                  sx={{ width: '100%' }}
                  slotProps={{
                    input: {
                      type: 'number',
                      inputProps: { min: 4, max: 100, step: 1 },
                    },
                  }}
                />
              </Box>
            </Box>
          </ListItem>

          {/* Halo Color and Size in one row */}
          <ListItem sx={sxClasses.listItem}>
            <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={sxClasses.label}>
                  {getLocalizedMessage(displayLanguage, 'drawer.textHaloColour')}
                </Typography>
                <MuiColorInput
                  value={localTextHaloColor}
                  onChange={handleTextHaloColorChange}
                  onBlur={handleTextHaloColorClose}
                  sx={sxClasses.input}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={sxClasses.label}>
                  {getLocalizedMessage(displayLanguage, 'drawer.textHaloWidth')}
                </Typography>
                <TextField
                  value={style.textHaloWidth}
                  onChange={handleTextHaloWidthChange}
                  sx={sxClasses.input}
                  slotProps={{
                    input: {
                      type: 'number',
                      inputProps: { min: 0, max: 100, step: 1 },
                    },
                  }}
                />
              </Box>
            </Box>
          </ListItem>
          <ListItem sx={sxClasses.listItem}>
            <Typography variant="subtitle2" sx={sxClasses.label}>
              {getLocalizedMessage(displayLanguage, 'drawer.textFormatting')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
              <IconButton
                aria-label={getLocalizedMessage(displayLanguage, 'drawer.textBold')}
                tooltipPlacement="bottom"
                onClick={handleToggleBold}
                className={style.textBold ? 'highlighted active' : ''}
                sx={{ width: 40, height: 40, borderRadius: '10%' }}
              >
                <FormatBoldIcon />
              </IconButton>
              <IconButton
                aria-label={getLocalizedMessage(displayLanguage, 'drawer.textItalic')}
                tooltipPlacement="bottom"
                onClick={handleToggleItalic}
                className={style.textItalic ? 'highlighted active' : ''}
                sx={{ width: 40, height: 40, borderRadius: '10%' }}
              >
                <FormatItalicIcon />
              </IconButton>
            </Box>
          </ListItem>
        </>
      )}

      {/* Fill color - hide for LineString and Text */}
      {memoCurrentGeomType !== 'LineString' && memoCurrentGeomType !== 'Text' && (
        <ListItem sx={sxClasses.listItem}>
          <Typography variant="subtitle2" sx={sxClasses.label}>
            {getLocalizedMessage(displayLanguage, 'drawer.fillColour')}
          </Typography>
          <MuiColorInput value={localFillColor} onChange={handleFillColorChange} onBlur={handleFillColorClose} sx={sxClasses.input} />
        </ListItem>
      )}

      {/* Point-specific controls */}
      {memoCurrentGeomType === 'Point' && (
        <ListItem sx={sxClasses.listItem}>
          <Typography variant="subtitle2" sx={sxClasses.label}>
            {getLocalizedMessage(displayLanguage, 'drawer.iconSize')}
          </Typography>
          <TextField
            value={style.iconSize || 24}
            onChange={handleIconSizeChange}
            sx={sxClasses.input}
            slotProps={{
              input: {
                type: 'number',
                inputProps: { min: 8, max: 100, step: 1 },
              },
            }}
          />
        </ListItem>
      )}

      {/* Stroke controls - show for all except Text */}
      {memoCurrentGeomType !== 'Text' && (
        <>
          <ListItem sx={sxClasses.listItem}>
            <Typography variant="subtitle2" sx={sxClasses.label}>
              {getLocalizedMessage(displayLanguage, 'drawer.strokeColour')}
            </Typography>
            <MuiColorInput
              value={localStrokeColor}
              onChange={handleStrokeColorChange}
              onBlur={handleStrokeColorClose}
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
                  inputProps: { min: 0, max: 100, step: 0.1 },
                },
              }}
            />
          </ListItem>
        </>
      )}
    </List>
  );
}
