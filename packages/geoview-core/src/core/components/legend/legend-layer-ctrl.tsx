import { useTheme } from '@mui/material';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  IconButton,
  Stack,
  VisibilityOutlinedIcon,
  HighlightOutlinedIcon,
  ZoomInSearchIcon,
  Typography,
  VisibilityOffOutlinedIcon,
  HighlightIcon,
} from '@/ui';
import { useLayerHighlightedLayer, useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { useMapStoreActions } from '@/core/stores/';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';

interface SecondaryControlsProps {
  layer: TypeLegendLayer;
  layerStatus: string;
  itemsLength: number;
  childLayers: TypeLegendLayer[];
}

// SecondaryControls component
export const SecondaryControls = memo(function SecondaryControls({ layer, layerStatus, itemsLength, childLayers }: SecondaryControlsProps) {
  logger.logDebug('legend1 - ctrl', layer, layerStatus, itemsLength, childLayers);
  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Stores
  const highlightedLayer = useLayerHighlightedLayer();
  const { getVisibilityFromOrderedLayerInfo, setOrToggleLayerVisibility } = useMapStoreActions();
  const { setHighlightLayer, zoomToLayerExtent } = useLayerStoreActions();

  const [visibility, setVisibility] = useState(getVisibilityFromOrderedLayerInfo(layer.layerPath));
  const isLayerVisible = layer.controls?.visibility ?? false;

  // #region Handlers
  const handleToggleVisibility = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>): void => {
      e.stopPropagation();
      setOrToggleLayerVisibility(layer.layerPath);
      setVisibility(getVisibilityFromOrderedLayerInfo(layer.layerPath));
    },
    [layer.layerPath, setOrToggleLayerVisibility]
  );

  const handleHighlightLayer = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>): void => {
      e.stopPropagation();
      setHighlightLayer(layer.layerPath);
    },
    [layer.layerPath, setHighlightLayer]
  );

  const handleZoomTo = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>): void => {
      e.stopPropagation();
      zoomToLayerExtent(layer.layerPath).catch((error) => {
        logger.logPromiseFailed('in zoomToLayerExtent in legend-layer.handleZoomTo', error);
      });
    },
    [layer.layerPath, zoomToLayerExtent]
  );
  // #endregion Handlers

  if (!['processed', 'loaded'].includes(layerStatus)) {
    return <Box />;
  }

  let subTitle = '';
  if (childLayers.length) {
    subTitle = t('legend.subLayersCount').replace('{count}', childLayers.length.toString());
  } else if (itemsLength > 1) {
    subTitle = t('legend.itemsCount').replace('{count}', itemsLength.toString()).replace('{totalCount}', itemsLength.toString());
  }

  return (
    <Stack direction="row" alignItems="center" sx={sxClasses.layerStackIcons}>
      {!!subTitle.length && <Typography fontSize={14}>{subTitle}</Typography>}
      <Box>
        <IconButton
          edge="end"
          tooltip="layers.toggleVisibility"
          className="buttonOutline"
          onClick={handleToggleVisibility}
          disabled={!isLayerVisible}
        >
          {visibility ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
        </IconButton>
        <IconButton
          tooltip="legend.highlightLayer"
          sx={{ marginTop: '-0.3125rem' }}
          className="buttonOutline"
          onClick={handleHighlightLayer}
        >
          {highlightedLayer === layer.layerPath ? <HighlightIcon /> : <HighlightOutlinedIcon />}
        </IconButton>
        <IconButton tooltip="legend.zoomTo" className="buttonOutline" onClick={handleZoomTo}>
          <ZoomInSearchIcon />
        </IconButton>
      </Box>
    </Stack>
  );
});
