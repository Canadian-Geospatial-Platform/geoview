import { useTheme } from '@mui/material';
import { useCallback, useMemo } from 'react';
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
  visibility: boolean;
}

// SecondaryControls component
export function SecondaryControls({ layer, layerStatus, itemsLength, childLayers, visibility }: SecondaryControlsProps): JSX.Element {
  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Stores
  const highlightedLayer = useLayerHighlightedLayer();
  const { setOrToggleLayerVisibility } = useMapStoreActions();
  const { setHighlightLayer, zoomToLayerExtent } = useLayerStoreActions();

  // Is button disabled?
  const isLayerVisible = layer.controls?.visibility ?? false;

  // #region Handlers Callbacks
  const handleToggleVisibility = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>): void => {
      e.stopPropagation();
      setOrToggleLayerVisibility(layer.layerPath);
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

  // Calculate subtitle after the condition
  let subTitle = '';
  if (childLayers.length) {
    subTitle = t('legend.subLayersCount').replace('{count}', childLayers.length.toString());
  } else if (itemsLength > 1) {
    subTitle = t('legend.itemsCount').replace('{count}', itemsLength.toString()).replace('{totalCount}', itemsLength.toString());
  }

  return (
    <Stack direction="row" alignItems="center" sx={sxClasses.layerStackIcons}>
      {!!subTitle.length && <Typography fontSize={14}>{subTitle}</Typography>}
      <Box sx={sxClasses.subtitle}>
        <IconButton
          edge="end"
          tooltip="layers.toggleVisibility"
          className="buttonOutline"
          onClick={handleToggleVisibility}
          disabled={!isLayerVisible}
        >
          {visibility ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
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
}
