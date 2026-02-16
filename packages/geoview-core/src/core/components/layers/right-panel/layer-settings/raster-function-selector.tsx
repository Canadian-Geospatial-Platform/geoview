import { useState, useEffect } from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText, Box, CircularProgress } from '@mui/material';
import { ImageNotSupported as ImageNotSupportedIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  useLayerStoreActions,
  useLayerSelectorRasterFunctionInfos,
  useLayerSelectorRasterFunction,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeMetadataEsriRasterFunctionInfos } from '@/api/types/layer-schema-types';
import { getSxClasses } from './layer-settings-style';

interface RasterFunctionSelectorProps {
  layerDetails: TypeLegendLayer;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onClickOutside: () => void;
}

interface RasterFunctionMenuItemProps {
  info: TypeMetadataEsriRasterFunctionInfos;
  isSelected: boolean;
  previewPromise: Promise<string> | undefined;
  onSelect: (name: string) => void;
}

function RasterFunctionMenuItem({ info, isSelected, previewPromise, onSelect }: RasterFunctionMenuItemProps): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!previewPromise) return;
    previewPromise
      .then(setPreviewSrc)
      .catch(() => setPreviewSrc(null))
      .finally(() => setLoading(false));
  }, [previewPromise]);

  const renderIcon = (): JSX.Element => {
    if (loading) {
      return (
        <Box sx={sxClasses.previewImageContainer}>
          <CircularProgress size={40} />
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
  const { layerDetails, anchorEl, onClose, onClickOutside } = props;
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { setLayerRasterFunction, getLayerRasterFunctionPreviews } = useLayerStoreActions();
  const rasterFunctionInfos = useLayerSelectorRasterFunctionInfos(layerDetails.layerPath) || [];
  const currentRasterFunction = useLayerSelectorRasterFunction(layerDetails.layerPath);
  const [previewPromises, setPreviewPromises] = useState<Map<string, Promise<string>>>(new Map());

  useEffect(() => {
    if (rasterFunctionInfos.length > 0) {
      const promises = getLayerRasterFunctionPreviews(layerDetails.layerPath);
      setPreviewPromises(promises);
    }
  }, [layerDetails.layerPath, rasterFunctionInfos.length, getLayerRasterFunctionPreviews]);

  const handleSelect = (rasterFunctionName: string): void => {
    setLayerRasterFunction(layerDetails.layerPath, rasterFunctionName);
  };

  const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown'): void => {
    if (reason === 'backdropClick' && onClickOutside) {
      // Clicking outside should close both menus
      onClickOutside();
    } else if (reason === 'escapeKeyDown') {
      // Escape should only close submenu
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.stopPropagation();
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
