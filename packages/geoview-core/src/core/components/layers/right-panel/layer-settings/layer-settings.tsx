import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Settings as SettingsIcon, Functions as FunctionsIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { RasterFunctionSelector } from './raster-function-selector';
import type { TypeLegendLayer } from '../../types';

interface LayerSettingsProps {
  layerDetails: TypeLegendLayer;
}

export function LayerSettings({ layerDetails }: LayerSettingsProps): JSX.Element | null {
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

  const handleClose = (): void => {
    setAnchorEl(null);
    setRasterFunctionAnchorEl(null); // Close submenu when main menu closes
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
        disableScrollLock
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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
