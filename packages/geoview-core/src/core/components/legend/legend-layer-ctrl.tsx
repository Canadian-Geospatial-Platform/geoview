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
import { TypeLegendItem, TypeLegendLayer } from '@/core/components/layers/types';
import { useMapStoreActions } from '@/core/stores/';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';

interface SecondaryControlsProps {
  layer: TypeLegendLayer;
  visibility: boolean; // Visibility come from store ordered layer info array
}

type ControlActions = {
  handleToggleVisibility: (e: React.MouseEvent) => void;
  handleHighlightLayer: (e: React.MouseEvent) => void;
  handleZoomTo: (e: React.MouseEvent) => void;
};

// Constant style outside of render
const styles = {
  btnMargin: { marginTop: '-0.3125rem' },
} as const;

// Memoize the sxClasses
const useStyles = () => {
  const theme = useTheme();
  return useMemo(() => getSxClasses(theme), [theme]);
};

// Custom hook for control actions
const useControlActions = (layerPath: string): ControlActions => {
  const { setOrToggleLayerVisibility } = useMapStoreActions();
  const { setHighlightLayer, zoomToLayerExtent } = useLayerStoreActions();

  return useMemo(
    () => ({
      handleToggleVisibility: (e: React.MouseEvent): void => {
        e.stopPropagation();
        setOrToggleLayerVisibility(layerPath);
      },
      handleHighlightLayer: (e: React.MouseEvent): void => {
        e.stopPropagation();
        setHighlightLayer(layerPath);
      },
      handleZoomTo: (e: React.MouseEvent): void => {
        e.stopPropagation();
        zoomToLayerExtent(layerPath).catch((error) => {
          logger.logPromiseFailed('in zoomToLayerExtent in legend-layer.handleZoomTo', error);
        });
      },
    }),
    [layerPath, setHighlightLayer, setOrToggleLayerVisibility, zoomToLayerExtent]
  );
};

// Create subtitle
const useSubtitle = (children: TypeLegendLayer[], items: TypeLegendItem[]): string => {
  // Hooks
  const { t } = useTranslation();
  const memoizedT = useCallback((key: string) => t(key), [t]);

  return useMemo(() => {
    if (children.length) {
      return memoizedT('legend.subLayersCount').replace('{count}', children.length.toString());
    }
    if (items.length > 1) {
      return memoizedT('legend.itemsCount')
        .replace('{count}', items.filter((item) => item.isVisible).length.toString())
        .replace('{totalCount}', items.length.toString());
    }
    return '';
  }, [children.length, items, memoizedT]);
};

// SecondaryControls component (no memo to force re render from layers panel modifications)
export function SecondaryControls({ layer, visibility }: SecondaryControlsProps): JSX.Element {
  logger.logTraceRender('components/legend/legend-layer-ctrl');

  // Hooks
  const sxClasses = useStyles();

  // Stores
  const highlightedLayer = useLayerHighlightedLayer();

  // Is button disabled?
  const isLayerVisible = layer.controls?.visibility ?? false;

  // Extract constant from layer prop
  const { layerStatus, items, children } = layer;

  // Component helper
  const controls = useControlActions(layer.layerPath);
  const subTitle = useSubtitle(children, items);

  if (!['processed', 'loaded'].includes(layerStatus || 'error')) {
    return <Box />;
  }

  return (
    <Stack direction="row" alignItems="center" sx={sxClasses.layerStackIcons}>
      {!!subTitle.length && <Typography fontSize={14}>{subTitle}</Typography>}
      <Box sx={sxClasses.subtitle}>
        <IconButton
          edge="end"
          tooltip="layers.toggleVisibility"
          className="buttonOutline"
          onClick={controls.handleToggleVisibility}
          disabled={!isLayerVisible}
        >
          {visibility ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
        </IconButton>
        <IconButton tooltip="legend.highlightLayer" sx={styles.btnMargin} className="buttonOutline" onClick={controls.handleHighlightLayer}>
          {highlightedLayer === layer.layerPath ? <HighlightIcon /> : <HighlightOutlinedIcon />}
        </IconButton>
        <IconButton tooltip="legend.zoomTo" className="buttonOutline" onClick={controls.handleZoomTo}>
          <ZoomInSearchIcon />
        </IconButton>
      </Box>
    </Stack>
  );
}
