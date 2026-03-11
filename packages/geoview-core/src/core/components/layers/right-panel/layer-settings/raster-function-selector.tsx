import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Menu, MenuItem, ListItemIcon, ListItemText, Box, CircularProgress } from '@/ui';
import { ImageNotSupportedIcon } from '@/ui';
import { getSxClasses } from './layer-settings-style';
import {
  useLayerStoreActions,
  useLayerSelectorRasterFunctionInfos,
  useLayerSelectorRasterFunction,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeMetadataEsriRasterFunctionInfos } from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';

interface RasterFunctionSelectorProps {
  layerDetails: TypeLegendLayer;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onClickOutside: (event: {}, reason?: 'backdropClick' | 'escapeKeyDown') => void;
}

interface RasterFunctionMenuItemProps {
  info: TypeMetadataEsriRasterFunctionInfos;
  isSelected: boolean;
  previewPromise: Promise<string> | undefined;
  onSelect: (name: string) => void;
}

function RasterFunctionMenuItem({ info, isSelected, previewPromise, onSelect }: RasterFunctionMenuItemProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/raster-function-selector > RasterFunctionMenuItem');

  // Hooks
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // State
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect(`RASTER FUNCTION MENU ITEM - image preview - ${info.name}`, previewPromise);

    if (!previewPromise) return;
    previewPromise
      .then(setPreviewSrc)
      .catch(() => setPreviewSrc(null))
      .finally(() => setLoading(false));
  }, [info.name, previewPromise]);

  const renderIcon = (): JSX.Element => {
    if (loading) {
      return (
        <Box sx={sxClasses.previewImageContainer}>
          <CircularProgress
            isLoaded={false}
            size={24}
            sx={{
              position: 'relative',
              backgroundColor: 'transparent',
            }}
            sxCircular={{
              width: '40px !important',
              height: '40px !important',
            }}
          />
        </Box>
      );
    }
    if (previewSrc) {
      return (
        <Box sx={sxClasses.previewImageContainer}>
          <Box component="img" src={previewSrc} alt={info.name} sx={sxClasses.previewImage} />
        </Box>
      );
    }
    return (
      <Box sx={sxClasses.previewImageContainer}>
        <ImageNotSupportedIcon sx={sxClasses.previewIcon} />
      </Box>
    );
  };

  return (
    <MenuItem onClick={() => onSelect(info.name)} selected={isSelected} sx={sxClasses.rasterFunctionMenuItem}>
      <ListItemIcon>{renderIcon()}</ListItemIcon>
      <ListItemText primary={info.name} secondary={info.description} sx={sxClasses.rasterFunctionListItemText} />
    </MenuItem>
  );
}

export function RasterFunctionSelector(props: RasterFunctionSelectorProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/raster-function-selector > RasterFunctionSelector');

  const { layerDetails, anchorEl, onClose, onClickOutside } = props;

  // Hooks
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Store actions
  const { setLayerRasterFunction, getLayerRasterFunctionPreviews } = useLayerStoreActions();

  // Store hooks
  const storeRasterFunctionInfos = useLayerSelectorRasterFunctionInfos(layerDetails.layerPath);
  const rasterFunctionInfos = useMemo(() => storeRasterFunctionInfos || [], [storeRasterFunctionInfos]);
  const currentRasterFunction = useLayerSelectorRasterFunction(layerDetails.layerPath);

  // State
  const [previewPromises, setPreviewPromises] = useState<Map<string, Promise<string>>>(new Map());

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('RASTER FUNCTION SELECTOR - Layer Raster Function Infos sync', rasterFunctionInfos);

    if (rasterFunctionInfos.length > 0) {
      const promises = getLayerRasterFunctionPreviews(layerDetails.layerPath);
      setPreviewPromises(promises);
    }
  }, [layerDetails.layerPath, rasterFunctionInfos, getLayerRasterFunctionPreviews]);

  const handleSelect = (rasterFunctionName: string): void => {
    setLayerRasterFunction(layerDetails.layerPath, rasterFunctionName);
  };

  const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown'): void => {
    if (reason === 'backdropClick' && onClickOutside) {
      // Clicking outside should close both menus
      onClickOutside(event, reason);
    } else if (reason === 'escapeKeyDown') {
      // Escape should only close submenu
      onClose();
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
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleClose}
      onKeyDown={handleKeyDown}
      disableScrollLock
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={sxClasses.rasterFunctionMenu}
      slotProps={{
        list: {
          autoFocus: true,
          autoFocusItem: true,
        },
      }}
    >
      {rasterFunctionInfos.map((info) => (
        <RasterFunctionMenuItem
          key={info.name}
          info={info}
          isSelected={currentRasterFunction === info.name}
          previewPromise={previewPromises.get(info.name)}
          onSelect={handleSelect}
        />
      ))}
    </Menu>
  );
}
