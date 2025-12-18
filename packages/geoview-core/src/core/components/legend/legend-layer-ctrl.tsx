import { useTheme } from '@mui/material';
import { useMemo } from 'react';
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
  CenterFocusScaleIcon,
  LayersIcon,
} from '@/ui';
import {
  useLayerHighlightedLayer,
  useLayerStoreActions,
  useLayerSelectorType,
  useLayerSelectorChildren,
  useLayerSelectorItems,
  useLayerSelectorControls,
  useLayerSelectorStatus,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useUIFooterBarComponents, useUIAppbarComponents } from '@/core/stores/store-interface-and-intial-values/ui-state';
import type { TypeLegendItem, TypeLegendLayer } from '@/core/components/layers/types';
import {
  useMapStoreActions,
  useMapSelectorLayerVisibility,
  useMapSelectorLayerInVisibleRange,
  useMapSelectorLayerParentHidden,
} from '@/core/stores/';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';
import { useNavigateToTab } from '@/core/components/common/hooks/use-navigate-to-tab';

// TODO: WCAG Issue #3108 - Check all icon buttons for aria-label clarity and translations
// TODO: WCAG Issue #3108 - Check all icon buttons for "state related" aria values (i.e aria-checked, aria-disabled, etc.)

interface SecondaryControlsProps {
  layerPath: string;
}

type ControlActions = {
  handleZoomToLayerVisibleScale: (event: React.MouseEvent) => void;
  handleToggleVisibility: (event: React.MouseEvent) => boolean;
  handleHighlightLayer: (event: React.MouseEvent) => void;
  handleZoomTo: (event: React.MouseEvent) => void;
};

// Custom hook for control actions
const useControlActions = (layerPath: string): ControlActions => {
  // Store
  const { setOrToggleLayerVisibility } = useMapStoreActions();
  const { setHighlightLayer, zoomToLayerExtent, zoomToLayerVisibleScale } = useLayerStoreActions();

  return useMemo(
    () => ({
      handleZoomToLayerVisibleScale: (event: React.MouseEvent): void => {
        event.stopPropagation();
        zoomToLayerVisibleScale(layerPath);
      },
      handleToggleVisibility: (event: React.MouseEvent): boolean => {
        event.stopPropagation();
        return setOrToggleLayerVisibility(layerPath);
      },
      handleHighlightLayer: (event: React.MouseEvent): void => {
        event.stopPropagation();
        setHighlightLayer(layerPath);
      },
      handleZoomTo: (event: React.MouseEvent): void => {
        event.stopPropagation();
        zoomToLayerExtent(layerPath).catch((error: unknown) => {
          logger.logPromiseFailed('in zoomToLayerExtent in legend-layer.handleZoomTo', error);
        });
      },
    }),
    [layerPath, setHighlightLayer, setOrToggleLayerVisibility, zoomToLayerExtent, zoomToLayerVisibleScale]
  );
};

// Create subtitle
const useSubtitle = (layerPath: string, children: TypeLegendLayer[], items: TypeLegendItem[]): string => {
  // Hooks
  const { t } = useTranslation();
  const parentHidden = useMapSelectorLayerParentHidden(layerPath);

  return useMemo(() => {
    if (parentHidden) return t('layers.parentHidden');

    if (children.length) {
      return t('legend.subLayersCount').replace('{count}', children.length.toString());
    }
    if (items.length > 1) {
      return t('legend.itemsCount')
        .replace('{count}', items.filter((item) => item.isVisible).length.toString())
        .replace('{totalCount}', items.length.toString());
    }
    return '';
  }, [children.length, items, parentHidden, t]);
};

// SecondaryControls component (no memo to force re render from layers panel modifications)
export function SecondaryControls({ layerPath }: SecondaryControlsProps): JSX.Element {
  // Add store actions for selecting layer and UI
  const { setSelectedLayerPath } = useLayerStoreActions();
  const footerBarComponents = useUIFooterBarComponents();
  const appBarComponents = useUIAppbarComponents();
  const hasFooterLayersTab = footerBarComponents.includes('layers');
  const hasAppBarLayersTab = appBarComponents.includes('layers');
  const hasLayersTab = hasFooterLayersTab || hasAppBarLayersTab;

  // Use navigate hook
  const navigateToLayers = useNavigateToTab('layers', setSelectedLayerPath);

  // Log
  logger.logTraceRender('components/legend/legend-layer-ctrl', layerPath);

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const layerType = useLayerSelectorType(layerPath);
  const layerChildren = useLayerSelectorChildren(layerPath);
  const layerItems = useLayerSelectorItems(layerPath);
  const layerControls = useLayerSelectorControls(layerPath);
  const layerStatus = useLayerSelectorStatus(layerPath);
  const isVisible = useMapSelectorLayerVisibility(layerPath);
  const isInVisibleRange = useMapSelectorLayerInVisibleRange(layerPath);
  const parentHidden = useMapSelectorLayerParentHidden(layerPath);
  const highlightedLayer = useLayerHighlightedLayer();

  // Is visibility button disabled?
  const isLayerVisibleCapable = layerControls?.visibility ?? false;

  // Is highlight button disabled?
  const isLayerHighlightCapable = layerControls?.highlight ?? false;

  // Is zoom to extent button disabled?
  const isLayerZoomToExtentCapable = layerControls?.zoom ?? false;

  // Is zoom to visible scale button visible?
  const isZoomToVisibleScaleCapable = !!((layerType as string) !== 'group' && !isInVisibleRange);

  // Component helper
  const controls = useControlActions(layerPath);
  const subTitle = useSubtitle(layerPath, layerChildren || [], layerItems || []);

  return (
    <Stack direction="row" alignItems="center" sx={sxClasses.layerStackIcons}>
      {!!subTitle.length && <Typography fontSize={14}>{subTitle}</Typography>}
      <Box sx={{ ...sxClasses.subtitle, display: 'flex', alignItems: 'center' }}>
        {/* Button to select layer in panel and scroll to footer */}
        {hasLayersTab && (
          <Box sx={sxClasses.buttonDivider}>
            <IconButton
              aria-label={t('legend.selectLayerAndScroll')}
              className="buttonOutline"
              onClick={(event) => {
                // Stop propagation to prevent AppBar's onScrollShellIntoView from firing
                event.stopPropagation();
                navigateToLayers({ layerPath });
              }}
            >
              <LayersIcon />
            </IconButton>
          </Box>
        )}
        <IconButton
          edge="end"
          aria-label={t('layers.zoomVisibleScale')}
          className={`buttonOutline ${isZoomToVisibleScaleCapable ? '' : 'outOfRangeButton'}`}
          onClick={controls.handleZoomToLayerVisibleScale}
        >
          <CenterFocusScaleIcon />
        </IconButton>
        {isLayerVisibleCapable && (
          <IconButton
            edge={isInVisibleRange ? false : 'end'}
            aria-label={t('layers.toggleVisibility')}
            className="buttonOutline"
            onClick={controls.handleToggleVisibility}
            disabled={!isInVisibleRange || parentHidden || layerStatus === 'error'}
          >
            {isVisible ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
          </IconButton>
        )}
        {isLayerHighlightCapable && (
          <IconButton
            aria-label={t('legend.highlightLayer')}
            className="buttonOutline"
            onClick={controls.handleHighlightLayer}
            disabled={!isInVisibleRange || parentHidden || !isVisible || layerStatus === 'error'}
          >
            {highlightedLayer === layerPath ? <HighlightIcon /> : <HighlightOutlinedIcon />}
          </IconButton>
        )}
        {isLayerZoomToExtentCapable && (
          <IconButton
            aria-label={t('legend.zoomTo')}
            className="buttonOutline"
            onClick={controls.handleZoomTo}
            disabled={!isInVisibleRange || parentHidden || !isVisible || layerStatus === 'error'}
          >
            <ZoomInSearchIcon />
          </IconButton>
        )}
      </Box>
    </Stack>
  );
}
