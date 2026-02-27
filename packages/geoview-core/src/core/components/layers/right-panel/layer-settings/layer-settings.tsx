import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Menu, MenuItem, ListItemIcon, ListItemText, IconButton } from '@/ui';
import { SettingsIcon, FunctionsIcon, CollectionsIcon } from '@/ui';

import { getSxClasses } from './layer-settings-style';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';

import { RasterFunctionSelector } from './raster-function-selector';
import type { TypeLegendLayer } from '../../types';
import { logger } from '@/core/utils/logger';
import { MosaicRuleSelector } from './mosaic-rule-selector';

interface LayerSettingsProps {
  layerDetails: TypeLegendLayer;
}

export function LayerSettings({ layerDetails }: LayerSettingsProps): JSX.Element | null {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/layer-settings');

  // Hooks
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { t } = useTranslation();

  // Hooks
  const { getLayerSettings } = useLayerStoreActions();
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [openSettingsType, setOpenSettingsType] = useState<'rasterFunction' | 'mosaicRule' | null>(null);

  // State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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
      setSettingsAnchorEl(null);
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
      <IconButton aria-label={t('layers.settings.title')} className="buttonOutline" onClick={handleClick} tooltipPlacement="bottom">
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
            selected={Boolean(settingsAnchorEl)}
            onClick={(event) => {
              setSettingsAnchorEl(event.currentTarget);
              setOpenSettingsType('rasterFunction');
            }}
          >
            <ListItemIcon>
              <FunctionsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('layers.settings.selectRasterFunction')}</ListItemText>
          </MenuItem>
        )}

        {availableSettings.includes('mosaicRule') && (
          <MenuItem
            selected={Boolean(settingsAnchorEl)}
            onClick={(event) => {
              setSettingsAnchorEl(event.currentTarget);
              setOpenSettingsType('mosaicRule');
            }}
          >
            <ListItemIcon>
              <CollectionsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('layers.settings.updateMosaicRule')}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {openSettingsType === 'rasterFunction' && (
        <RasterFunctionSelector
          layerDetails={layerDetails}
          anchorEl={settingsAnchorEl}
          onClose={() => {
            setSettingsAnchorEl(null);
            setOpenSettingsType(null);
          }}
          onClickOutside={handleClose}
        />
      )}

      {openSettingsType === 'mosaicRule' && (
        <MosaicRuleSelector
          layerDetails={layerDetails}
          anchorEl={settingsAnchorEl}
          onClose={() => {
            setSettingsAnchorEl(null);
            setOpenSettingsType(null);
          }}
          onClickOutside={handleClose}
        />
      )}
    </>
  );
}
