import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Menu, MenuItem, ListItemIcon, ListItemText, Box, CircularProgress } from '@/ui';
import { ImageNotSupportedIcon } from '@/ui';
import { getSxClasses } from './layer-settings-style';
import { useLayerStoreActions, useLayerSelectorWmsStyle } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeMetadataWMSCapabilityLayerStyle } from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';

interface WmsStyleSelectorProps {
  layerDetails: TypeLegendLayer;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onClickOutside: (event: {}, reason?: 'backdropClick' | 'escapeKeyDown') => void;
}

interface WmsStyleMenuItemProps {
  style: TypeMetadataWMSCapabilityLayerStyle;
  isSelected: boolean;
  onSelect: (name: string) => void;
}

function WmsStyleMenuItem({ style, isSelected, onSelect }: WmsStyleMenuItemProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/wms-style-selector > WmsStyleMenuItem');

  // Hooks
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // State
  const [legendSrc, setLegendSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect(`WMS STYLE MENU ITEM - legend image - ${style.Name}`, style.LegendURL);

    // Get the first legend URL if available
    const legendUrl = style.LegendURL?.[0]?.OnlineResource?.['@attributes']?.['xlink:href'];

    if (legendUrl) {
      setLegendSrc(legendUrl);
      setLoading(false);
    } else {
      setLegendSrc(null);
      setLoading(false);
    }
  }, [style]);

  const renderIcon = (): JSX.Element => {
    if (loading) {
      return (
        <Box sx={sxClasses.wmsStylePreviewImageContainer}>
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
    if (legendSrc) {
      return (
        <Box sx={sxClasses.wmsStylePreviewImageContainer}>
          <Box component="img" src={legendSrc} alt={style.Name} sx={sxClasses.wmsStylePreviewImage} />
        </Box>
      );
    }
    return (
      <Box sx={sxClasses.wmsStylePreviewImageContainer}>
        <ImageNotSupportedIcon sx={sxClasses.settingSelectorPreviewIcon} />
      </Box>
    );
  };

  return (
    <MenuItem onClick={() => onSelect(style.Name)} selected={isSelected} sx={sxClasses.wmsStyleMenuItem}>
      <ListItemIcon>{renderIcon()}</ListItemIcon>
      <ListItemText primary={style.Name} sx={sxClasses.settingSelectorListItemText} />
    </MenuItem>
  );
}

export function WmsStyleSelector(props: WmsStyleSelectorProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/wms-style-selector > WmsStyleSelector');

  const { layerDetails, anchorEl, onClose, onClickOutside } = props;

  // Hooks
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Store actions
  const { setLayerWmsStyle, getLayerWmsAvailableStyles } = useLayerStoreActions();

  // Store hooks
  const currentWmsStyle = useLayerSelectorWmsStyle(layerDetails.layerPath);

  // Get the full style metadata
  const wmsStyleArray = useMemo(
    () => getLayerWmsAvailableStyles(layerDetails.layerPath) || [],
    [getLayerWmsAvailableStyles, layerDetails.layerPath]
  );

  const handleSelect = (wmsStyleName: string): void => {
    setLayerWmsStyle(layerDetails.layerPath, wmsStyleName);
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
      sx={sxClasses.settingSelectorMenu}
      slotProps={{
        list: {
          autoFocus: true,
          autoFocusItem: true,
        },
      }}
    >
      {wmsStyleArray.map((style) => (
        <WmsStyleMenuItem key={style.Name} style={style} isSelected={currentWmsStyle === style.Name} onSelect={handleSelect} />
      ))}
    </Menu>
  );
}
