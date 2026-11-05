import type { TypeWindow } from 'geoview-core';
import { MuiColorInput } from 'mui-color-input';
import type { MuiColorInputProps } from 'mui-color-input';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import {
  useStoreDrawerStyle,
  useStoreDrawerActiveGeom,
  useStoreDrawerSelectedDrawingType,
} from 'geoview-core/core/stores/states/drawer-state';
import { useDrawerController } from 'geoview-core/core/controllers/use-controllers';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { logger } from 'geoview-core/core/utils/logger';
import type { Theme, SxStyles } from 'geoview-core/ui/style/types';
import { geoViewColors as defaultGeoViewColors, GEOVIEW_SHAPE } from 'geoview-core/ui/style/default';
import { getFocusIndicatorStyles } from 'geoview-core/ui/style/themeOptionsGenerator';

import { FONT_OPTIONS, DEFAULT_FONT, loadGoogleFont } from '../utils/fonts';

/**
 * Builds the style panel's sx classes.
 *
 * @param theme - The MUI theme
 * @returns The sx classes object
 */
const getSxClasses = (theme: Theme): SxStyles => ({
  listItem: {
    marginBottom: theme.spacing(1.5),
    padding: theme.spacing(0),
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  label: {
    marginBottom: theme.spacing(0.25),
  },
  input: {
    width: '100%',
  },
  numberInput: {
    width: '100%',
    padding: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadiusSm,
  },
  row: {
    display: 'flex',
    gap: theme.spacing(0.5),
    width: '100%',
  },
  rowItem: {
    flex: 1,
  },
  formattingRow: {
    display: 'flex',
    gap: theme.spacing(0.25),
    width: '100%',
  },
  formatButton: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.borderRadiusFull,
    '&.Mui-focusVisible': {
      ...getFocusIndicatorStyles(theme.palette.geoViewColor ?? defaultGeoViewColors),
      boxShadow: 'none',
      outlineOffset: 0,
    },
  },
});

/**
 * Renders the style button icon.
 *
 * @returns The palette icon element
 */
export function StyleButton(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/style > StyleButton');

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
  const { useTheme } = ui;
  const { t } = useTranslation<string>();

  // Components
  const { Box, List, ListItem, Typography, TextField, IconButton, FormatBoldIcon, FormatItalicIcon } = ui.elements;

  const theme = useTheme();
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Get store values
  const style = useStoreDrawerStyle();
  const activeGeom = useStoreDrawerActiveGeom();
  const selectedDrawingType = useStoreDrawerSelectedDrawingType();
  const drawerController = useDrawerController();

  /** The current geometry type, using the selected drawing type or active geometry as fallback. */
  const currentGeomType = selectedDrawingType ?? activeGeom;

  // Local state for color inputs
  const [localFillColor, setLocalFillColor] = useState<string>(style.fillColor);
  const [localStrokeColor, setLocalStrokeColor] = useState<string>(style.strokeColor);
  const [localTextColor, setLocalTextColor] = useState<string>(style.textColor || '#000000');
  const [localTextHaloColor, setLocalTextHaloColor] = useState<string>(style.textHaloColor || 'rgba(255,255,255,0.8)');

  // #region Handlers

  /**
   * Handles when the user changes the text value
   */
  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      drawerController.setTextValue(event.target.value);
    },
    [drawerController]
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

      drawerController.setTextFont(selectedFont);
    },
    [drawerController]
  );

  /**
   * Handles when the user changes the text size
   */
  const handleTextSizeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const size = parseInt(event.target.value, 10);
      if (!Number.isNaN(size)) drawerController.setTextSize(size);
    },
    [drawerController]
  );

  /**
   * Handles when the user changes the text halo width
   */
  const handleTextHaloWidthChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const size = parseInt(event.target.value, 10);
      if (!Number.isNaN(size)) drawerController.setTextHaloWidth(size);
    },
    [drawerController]
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
    drawerController.setFillColor(localFillColor);
  }, [drawerController, localFillColor]);

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
    drawerController.setStrokeColor(localStrokeColor);
  }, [drawerController, localStrokeColor]);

  /**
   * Handles when the user changes the icon size
   */
  const handleIconSizeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const size = parseInt(event.target.value, 10);
      if (!Number.isNaN(size)) drawerController.setDrawerIconSize(size);
    },
    [drawerController]
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
    drawerController.setTextColor(localTextColor);
  }, [drawerController, localTextColor]);

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
    drawerController.setTextHaloColor(localTextHaloColor);
  }, [drawerController, localTextHaloColor]);

  /**
   * Handles when the user changes the stroke width
   */
  const handleStrokeWidthChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const width = parseFloat(event.target.value);
      if (Number.isNaN(width)) return;
      drawerController.setStrokeWidth(width);
    },
    [drawerController]
  );

  /**
   * Handles when the user toggles bold formatting
   */
  const handleToggleBold = useCallback((): void => {
    drawerController.setTextBold(!style.textBold);
  }, [drawerController, style.textBold]);

  /**
   * Handles when the user toggles italic formatting
   */
  const handleToggleItalic = useCallback((): void => {
    drawerController.setTextItalic(!style.textItalic);
  }, [drawerController, style.textItalic]);

  // #endregion

  /**
   * Sets up only this input's portaled picker, updating its header without replacing the focused close button.
   *
   * @param paper - The picker paper, or null when its ref detaches
   */
  const setupColorPicker = useCallback(
    (paper: HTMLDivElement | null): void => {
      if (!paper) return;

      /**
       * Applies this map's typography to a new or already-open picker header.
       *
       * @param header - The picker-owned header
       */
      const applyColorPickerTypography = (header: HTMLElement): void => {
        const { body1, body2, fontWeightMedium, fontWeightRegular } = theme.typography;
        const closeBtn = header.querySelector<HTMLButtonElement>('.color-picker-close-btn');
        if (
          body1.fontSize === undefined ||
          body2.fontSize === undefined ||
          fontWeightMedium === undefined ||
          fontWeightRegular === undefined ||
          !closeBtn
        ) {
          logger.logError('STYLE PANEL - Color picker typography or close button is missing');
          return;
        }
        closeBtn.setAttribute('aria-label', t('drawer.closeColourPicker'));
        header.style.setProperty('font-family', theme.typography.fontFamily ?? 'inherit');
        header.style.setProperty('font-size', typeof body2.fontSize === 'number' ? `${body2.fontSize}px` : body2.fontSize);
        header.style.setProperty('font-weight', `${fontWeightMedium}`);
        closeBtn.style.fontSize = typeof body1.fontSize === 'number' ? `${body1.fontSize}px` : body1.fontSize;
        closeBtn.style.fontWeight = `${fontWeightRegular}`;
      };

      const existingTitle = paper.querySelector<HTMLSpanElement>('.color-picker-title');
      if (existingTitle?.parentElement) {
        existingTitle.textContent = t('drawer.colourPicker');
        applyColorPickerTypography(existingTitle.parentElement);
        return;
      }

      // The portal is outside the map subtree; the paper ref retains its input's ownership.
      const popover = paper.querySelector('.MuiColorInput-PopoverBody');
      if (!popover?.parentElement) {
        logger.logError('STYLE PANEL - Color picker body missing from its paper');
        return;
      }

      const header = paper.ownerDocument.createElement('div');
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0px 0px 8px 8px;
      `;
      const title = paper.ownerDocument.createElement('span');
      title.className = 'color-picker-title';
      title.textContent = t('drawer.colourPicker');
      header.appendChild(title);

      const closeBtn = paper.ownerDocument.createElement('button');
      closeBtn.className = 'color-picker-close-btn';
      closeBtn.textContent = '✕';
      closeBtn.style.cssText = `
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: ${GEOVIEW_SHAPE.borderRadiusFull};
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
      applyColorPickerTypography(header);
      popover.parentElement.insertBefore(header, popover);
    },
    [t, theme]
  );

  /** Keeps the picker-owned paper ref stable across unrelated style-panel renders. */
  const memoPopoverProps = useMemo((): NonNullable<MuiColorInputProps['PopoverProps']> => {
    logger.logTraceUseMemo('STYLE PANEL - Color picker paper props');
    return { slotProps: { paper: { ref: setupColorPicker } } };
  }, [setupColorPicker]);

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
    <List>
      {/* Text-specific controls */}
      {currentGeomType === 'Text' && (
        <>
          <ListItem sx={memoSxClasses.listItem}>
            <Typography variant="subtitle2" sx={memoSxClasses.label}>
              {t('drawer.text')}
            </Typography>
            <TextField value={style.text || ''} onChange={handleTextChange} sx={memoSxClasses.input} placeholder="Enter text" multiline />
          </ListItem>

          <ListItem sx={memoSxClasses.listItem}>
            <Typography variant="subtitle2" sx={memoSxClasses.label}>
              {t('drawer.textFont')}
            </Typography>
            <TextField
              select
              value={style.textFont || DEFAULT_FONT}
              onChange={handleFontChange}
              sx={{
                ...memoSxClasses.input,
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
          <ListItem sx={memoSxClasses.listItem}>
            <Box sx={memoSxClasses.row}>
              <Box sx={memoSxClasses.rowItem}>
                <Typography variant="subtitle2" sx={memoSxClasses.label}>
                  {t('drawer.textColour')}
                </Typography>
                <MuiColorInput
                  PopoverProps={memoPopoverProps}
                  value={localTextColor}
                  onChange={handleTextColorChange}
                  onBlur={handleTextColorClose}
                  sx={memoSxClasses.input}
                />
              </Box>
              <Box sx={memoSxClasses.rowItem}>
                <Typography variant="subtitle2" sx={memoSxClasses.label}>
                  {t('drawer.textSize')}
                </Typography>
                <TextField
                  value={style.textSize || 14}
                  onChange={handleTextSizeChange}
                  sx={memoSxClasses.input}
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
          <ListItem sx={memoSxClasses.listItem}>
            <Box sx={memoSxClasses.row}>
              <Box sx={memoSxClasses.rowItem}>
                <Typography variant="subtitle2" sx={memoSxClasses.label}>
                  {t('drawer.textHaloColour')}
                </Typography>
                <MuiColorInput
                  PopoverProps={memoPopoverProps}
                  value={localTextHaloColor}
                  onChange={handleTextHaloColorChange}
                  onBlur={handleTextHaloColorClose}
                  sx={memoSxClasses.input}
                />
              </Box>
              <Box sx={memoSxClasses.rowItem}>
                <Typography variant="subtitle2" sx={memoSxClasses.label}>
                  {t('drawer.textHaloWidth')}
                </Typography>
                <TextField
                  value={style.textHaloWidth}
                  onChange={handleTextHaloWidthChange}
                  sx={memoSxClasses.input}
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
          <ListItem sx={memoSxClasses.listItem}>
            <Typography variant="subtitle2" sx={memoSxClasses.label}>
              {t('drawer.textFormatting')}
            </Typography>
            <Box sx={memoSxClasses.formattingRow}>
              <IconButton
                aria-label={t('drawer.textBold')}
                tooltipPlacement="bottom"
                onClick={handleToggleBold}
                className={style.textBold ? 'highlighted active' : ''}
                sx={memoSxClasses.formatButton}
              >
                <FormatBoldIcon />
              </IconButton>
              <IconButton
                aria-label={t('drawer.textItalic')}
                tooltipPlacement="bottom"
                onClick={handleToggleItalic}
                className={style.textItalic ? 'highlighted active' : ''}
                sx={memoSxClasses.formatButton}
              >
                <FormatItalicIcon />
              </IconButton>
            </Box>
          </ListItem>
        </>
      )}

      {/* Fill color - hide for LineString and Text */}
      {currentGeomType !== 'LineString' && currentGeomType !== 'Text' && (
        <ListItem sx={memoSxClasses.listItem}>
          <Typography variant="subtitle2" sx={memoSxClasses.label}>
            {t('drawer.fillColour')}
          </Typography>
          <MuiColorInput
            PopoverProps={memoPopoverProps}
            value={localFillColor}
            onChange={handleFillColorChange}
            onBlur={handleFillColorClose}
            sx={memoSxClasses.input}
          />
        </ListItem>
      )}

      {/* Point-specific controls */}
      {currentGeomType === 'Point' && (
        <ListItem sx={memoSxClasses.listItem}>
          <Typography variant="subtitle2" sx={memoSxClasses.label}>
            {t('drawer.iconSize')}
          </Typography>
          <TextField
            value={style.iconSize || 24}
            onChange={handleIconSizeChange}
            sx={memoSxClasses.input}
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
      {currentGeomType !== 'Text' && (
        <>
          <ListItem sx={memoSxClasses.listItem}>
            <Typography variant="subtitle2" sx={memoSxClasses.label}>
              {t('drawer.strokeColour')}
            </Typography>
            <MuiColorInput
              PopoverProps={memoPopoverProps}
              value={localStrokeColor}
              onChange={handleStrokeColorChange}
              onBlur={handleStrokeColorClose}
              sx={memoSxClasses.input}
            />
          </ListItem>

          <ListItem sx={memoSxClasses.listItem}>
            <Typography variant="subtitle2" sx={memoSxClasses.label}>
              {t('drawer.strokeWidth')}
            </Typography>
            <TextField
              value={style.strokeWidth}
              onChange={handleStrokeWidthChange}
              sx={memoSxClasses.input}
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
