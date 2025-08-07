import { TypeWindow } from 'geoview-core';
import { MuiColorInput } from 'mui-color-input';
import { ChangeEvent, useState } from 'react';
import {
  useDrawerStyle,
  useDrawerActiveGeom,
  useDrawerActions,
} from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { logger } from 'geoview-core/core/utils/logger';

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
  const { useCallback, useEffect } = reactUtilities.react;

  // Components
  const { List, ListItem, Typography, TextField } = ui.elements;

  // Get store values
  const style = useDrawerStyle();
  const activeGeom = useDrawerActiveGeom();
  const displayLanguage = useAppDisplayLanguage();

  // Local state for color inputs
  const [localFillColor, setLocalFillColor] = useState(style.fillColor);
  const [localStrokeColor, setLocalStrokeColor] = useState(style.strokeColor);
  const [localTextColor, setLocalTextColor] = useState(style.textColor || '#000000');
  const [localTextHaloColor, setLocalTextHaloColor] = useState(style.textHaloColor || 'rgba(255,255,255,0.8)');

  // Store actions
  const { setFillColor, setStrokeColor, setStrokeWidth, setStyle } = useDrawerActions();

  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setStyle({ ...style, text: event.target.value });
    },
    [setStyle, style]
  );

  const handleTextSizeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const size = parseInt(event.target.value, 10);
      if (!Number.isNaN(size)) setStyle({ ...style, textSize: size });
    },
    [setStyle, style]
  );

  const handleTextHaloWidthChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const size = parseInt(event.target.value, 10);
      if (!Number.isNaN(size)) setStyle({ ...style, textHaloWidth: size });
    },
    [setStyle, style]
  );

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

  const handleTextColorChange = useCallback((newColor: string): void => {
    setLocalTextColor(newColor);
  }, []);

  const handleTextColorClose = useCallback((): void => {
    setStyle({ ...style, textColor: localTextColor });
  }, [setStyle, style, localTextColor]);

  const handleTextHaloColorChange = useCallback((newColor: string): void => {
    setLocalTextHaloColor(newColor);
  }, []);

  const handleTextHaloColorClose = useCallback((): void => {
    setStyle({ ...style, textHaloColor: localTextHaloColor });
  }, [setStyle, style, localTextHaloColor]);

  const handleStrokeWidthChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const width = parseFloat(event.target.value);
      if (Number.isNaN(width)) return;
      setStrokeWidth(width);
    },
    [setStrokeWidth]
  );

  // Add close button to MUIColorInputs
  useEffect(() => {
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

  /**
   * Render style controls in navbar panel
   * @returns ReactNode
   */
  return (
    <List sx={{ p: 2 }}>
      {/* Text-specific controls */}
      {activeGeom === 'Text' && (
        <>
          <ListItem sx={sxClasses.listItem}>
            <Typography variant="subtitle2" sx={sxClasses.label}>
              {getLocalizedMessage(displayLanguage, 'drawer.text')}
            </Typography>
            <TextField value={style.text || ''} onChange={handleTextChange} sx={sxClasses.input} placeholder="Enter text" />
          </ListItem>

          <ListItem sx={sxClasses.listItem}>
            <Typography variant="subtitle2" sx={sxClasses.label}>
              {getLocalizedMessage(displayLanguage, 'drawer.textColour')}
            </Typography>
            <MuiColorInput value={localTextColor} onChange={handleTextColorChange} onBlur={handleTextColorClose} sx={sxClasses.input} />
          </ListItem>

          <ListItem sx={sxClasses.listItem}>
            <Typography variant="subtitle2" sx={sxClasses.label}>
              {getLocalizedMessage(displayLanguage, 'drawer.textSize')}
            </Typography>
            <TextField
              value={style.textSize || 14}
              onChange={handleTextSizeChange}
              sx={sxClasses.input}
              slotProps={{
                input: {
                  type: 'number',
                  inputProps: { min: 4, max: 100, step: 1 },
                },
              }}
            />
          </ListItem>

          <ListItem sx={sxClasses.listItem}>
            <Typography variant="subtitle2" sx={sxClasses.label}>
              {getLocalizedMessage(displayLanguage, 'drawer.textHaloColour')}
            </Typography>
            <MuiColorInput
              value={localTextHaloColor}
              onChange={handleTextHaloColorChange}
              onBlur={handleTextHaloColorClose}
              sx={sxClasses.input}
            />
          </ListItem>

          <ListItem sx={sxClasses.listItem}>
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
          </ListItem>
        </>
      )}

      {/* Fill color - hide for LineString and Text */}
      {activeGeom !== 'LineString' && activeGeom !== 'Text' && (
        <ListItem sx={sxClasses.listItem}>
          <Typography variant="subtitle2" sx={sxClasses.label}>
            {getLocalizedMessage(displayLanguage, 'drawer.fillColour')}
          </Typography>
          <MuiColorInput value={localFillColor} onChange={handleFillColorChange} onBlur={handleFillColorClose} sx={sxClasses.input} />
        </ListItem>
      )}

      {/* Stroke controls - show for all except Text */}
      {activeGeom !== 'Text' && (
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
                  inputProps: { min: 0, max: 10, step: 0.1 },
                },
              }}
            />
          </ListItem>
        </>
      )}
    </List>
  );
}
