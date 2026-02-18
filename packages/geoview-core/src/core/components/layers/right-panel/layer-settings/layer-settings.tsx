import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Settings as SettingsIcon, Functions as FunctionsIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { RasterFunctionSelector } from './raster-function-selector';
import { useTheme } from '@mui/material/styles';
import { getSxClasses } from './layer-settings-style';
import type { TypeLegendLayer } from '../../types';

interface LayerSettingsProps {
  layerDetails: TypeLegendLayer;
}

export function LayerSettings({ layerDetails }: LayerSettingsProps): JSX.Element | null {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { t } = useTranslation();

  const { getLayerSettings } = useLayerStoreActions();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [rasterFunctionAnchorEl, setRasterFunctionAnchorEl] = useState<null | HTMLElement>(null);

  const availableSettings = getLayerSettings(layerDetails.layerPath);

  // Don't render if no settings available
  if (!availableSettings || availableSettings.length === 0) {
    return null;
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event: {}, reason?: 'backdropClick' | 'escapeKeyDown'): void => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      setAnchorEl(null);
      setRasterFunctionAnchorEl(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Tab') {
      event.preventDefault();

      // Get all menu items
      const menuItems = event.currentTarget.querySelectorAll('[role="menuitem"]');
      const currentIndex = Array.from(menuItems).findIndex((item) => item === document.activeElement);

      let nextIndex;
      if (currentIndex === -1) {
        // No item focused, focus first item
        nextIndex = 0;
      } else if (event.shiftKey) {
        // Shift+Tab: move up
        nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
      } else {
        // Tab: move down
        nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
      }

      (menuItems[nextIndex] as HTMLElement)?.focus();
    }
  };

  return (
    <>
      <IconButton aria-label={t('layers.settings')!} className="buttonOutline" onClick={handleClick}>
        <SettingsIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onKeyDown={handleKeyDown}
        disableScrollLock
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={sxClasses.layerSettingsMenu}
        slotProps={{
          list: {
            autoFocus: true,
            autoFocusItem: true,
          },
        }}
      >
        {availableSettings.includes('rasterFunction') && (
          <MenuItem
            selected={Boolean(rasterFunctionAnchorEl)}
            onClick={(event) => {
              setRasterFunctionAnchorEl(event.currentTarget);
            }}
          >
            <ListItemIcon>
              <FunctionsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('layers.selectRasterFunction')}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <RasterFunctionSelector
        layerDetails={layerDetails}
        anchorEl={rasterFunctionAnchorEl}
        onClose={() => setRasterFunctionAnchorEl(null)}
        onClickOutside={handleClose} // Close both menus
      />
    </>
  );
}
