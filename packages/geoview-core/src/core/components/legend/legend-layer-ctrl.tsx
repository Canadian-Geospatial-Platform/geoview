import { useMemo, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material';
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
  useLayerSelectorChildren,
  useLayerSelectorItems,
  useLayerSelectorControls,
  useLayerSelectorStatus,
  useLayerSelectorEntryType,
  useLayerSelectorName,
  setStoreLayerSelectedLayersTabLayer,
  getStoreLayerStateLegendLayerByPath,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import {
  useUIFooterBarComponents,
  useUIAppbarComponents,
  useUIActiveTrapGeoView,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import {
  getStoreMapLayerParentHidden,
  getStoreMapOrderedLayerInfoByPath,
  useMapSelectorLayerInVisibleRange,
  useMapSelectorLayerParentHidden,
  useMapSelectorLayerVisibility,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import type { TypeLegendItem, TypeLegendLayer } from '@/core/components/layers/types';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';
import { useNavigateToTab } from '@/core/components/common/hooks/use-navigate-to-tab';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useLayerController } from '@/core/controllers/layer-controller';
import { useMapController } from '@/core/controllers/map-controller';

// TODO: WCAG Issue #3332 - Consider disabling Zoom to Layer button when it's already zoomed to that layer's extent
// TODO: WCAG - Consider showing Show in Time Slider button in WCAG mode (requires re-working WCAG UX)

interface SecondaryControlsProps {
  layerPath: string;
}

type ControlActions = {
  handleZoomToLayerVisibleScale: (event: React.MouseEvent) => void;
  handleToggleVisibility: (event: React.MouseEvent) => boolean;
  handleHighlightLayer: (event: React.MouseEvent) => void;
  handleZoomTo: (event: React.MouseEvent) => void;
};

/**
 * Custom hook for control actions.
 *
 * Performance optimization: Only depends on layerPath for stable memoization.
 * State values (visibility, parentHidden, etc.) are read imperatively from the store
 * inside each handler when executed, preventing callback recreation on every state change.
 */
const useControlActions = (layerPath: string): ControlActions => {
  // Store
  const mapId = useGeoViewMapId();
  const layerController = useLayerController();
  const mapController = useMapController();

  return useMemo(
    () => ({
      handleZoomToLayerVisibleScale: (event: React.MouseEvent): void => {
        event.stopPropagation();
        // Read current state values when handler executes
        // TODO: CHECK -This should likely go through a Zustand hook instead of a state getter
        const layer = getStoreLayerStateLegendLayerByPath(mapId, layerPath);

        // Use orderedLayerInfo to check visibility range
        const layerInfo = getStoreMapOrderedLayerInfoByPath(mapId, layerPath);
        const isInVisibleRange = layerInfo?.inVisibleRange || false;

        const isZoomToVisibleScaleCapable = !isInVisibleRange && layer?.entryType !== 'group';
        if (!isZoomToVisibleScaleCapable) {
          return;
        }
        mapController.zoomToLayerVisibleScale(layerPath);
      },
      handleToggleVisibility: (event: React.MouseEvent): boolean => {
        event.stopPropagation();
        // Read current state values when handler executes
        // TODO: CHECK -This should likely go through a Zustand hook instead of a state getter
        const layer = getStoreLayerStateLegendLayerByPath(mapId, layerPath);
        const layerInfo = getStoreMapOrderedLayerInfoByPath(mapId, layerPath);
        const isInVisibleRange = layerInfo?.inVisibleRange || false;
        const parentHidden = getStoreMapLayerParentHidden(mapId, layerPath);

        if (!isInVisibleRange || parentHidden || layer?.layerStatus === 'error') {
          return false;
        }
        return mapController.setOrToggleMapLayerVisibility(layerPath);
      },
      handleHighlightLayer: (event: React.MouseEvent): void => {
        event.stopPropagation();
        // Read current state values when handler executes
        // TODO: CHECK -This should likely go through a Zustand hook instead of a state getter
        const layer = getStoreLayerStateLegendLayerByPath(mapId, layerPath);
        const layerInfo = getStoreMapOrderedLayerInfoByPath(mapId, layerPath);
        const isInVisibleRange = layerInfo?.inVisibleRange || false;
        const parentHidden = getStoreMapLayerParentHidden(mapId, layerPath);
        const isVisible = layerInfo?.visible || false;

        if (!isInVisibleRange || parentHidden || !isVisible || layer?.layerStatus === 'error') {
          return;
        }
        layerController.setHighlightLayer(layerPath);
      },
      handleZoomTo: (event: React.MouseEvent): void => {
        event.stopPropagation();
        // Read current state values when handler executes
        // TODO: REFACTOR - This isn't an ideal pattern, review.
        const layer = getStoreLayerStateLegendLayerByPath(mapId, layerPath);
        const layerInfo = getStoreMapOrderedLayerInfoByPath(mapId, layerPath);
        const isInVisibleRange = layerInfo?.inVisibleRange || false;
        const parentHidden = getStoreMapLayerParentHidden(mapId, layerPath);
        const isVisible = layerInfo?.visible || false;

        const isZoomToLayerDisabled = !isInVisibleRange || parentHidden || !isVisible || layer?.layerStatus === 'error';
        if (isZoomToLayerDisabled) {
          return;
        }
        mapController.zoomToLayerExtent(layerPath).catch((error: unknown) => {
          logger.logPromiseFailed('in zoomToLayerExtent in legend-layer.handleZoomTo', error);
        });
      },
    }),
    [layerPath, mapId, layerController, mapController]
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
  const footerBarComponents = useUIFooterBarComponents();
  const appBarComponents = useUIAppbarComponents();
  const hasFooterLayersTab = footerBarComponents.includes('layers');
  const hasAppBarLayersTab = appBarComponents.includes('layers');
  const hasLayersTab = hasFooterLayersTab || hasAppBarLayersTab;

  // Use navigate hook
  const navigateToLayers = useNavigateToTab('layers', setStoreLayerSelectedLayersTabLayer);

  // Create stable handler for layer navigation
  const handleNavigateToLayers = useCallback(
    (event: React.MouseEvent) => {
      // Stop propagation to prevent AppBar's onScrollShellIntoView from firing
      event.stopPropagation();
      navigateToLayers({ layerPath });
    },
    [navigateToLayers, layerPath]
  );

  // Log
  logger.logTraceRender('components/legend/legend-layer-ctrl', layerPath);

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const layerEntryType = useLayerSelectorEntryType(layerPath);
  const layerChildren = useLayerSelectorChildren(layerPath);
  const layerItems = useLayerSelectorItems(layerPath);
  const layerControls = useLayerSelectorControls(layerPath);
  const layerStatus = useLayerSelectorStatus(layerPath);
  const isVisible = useMapSelectorLayerVisibility(layerPath);
  const isInVisibleRange = useMapSelectorLayerInVisibleRange(layerPath);
  const parentHidden = useMapSelectorLayerParentHidden(layerPath);
  const highlightedLayer = useLayerHighlightedLayer();
  const isFocusTrap = useUIActiveTrapGeoView();
  const layerName = useLayerSelectorName(layerPath) ?? layerPath;

  // Is visibility button disabled?
  const isLayerVisibleCapable = layerControls?.visibility ?? false;

  // Is highlight button disabled?
  const isLayerHighlightCapable = layerControls?.highlight ?? false;

  // Is zoom to extent button disabled?
  const isLayerZoomToExtentCapable = layerControls?.zoom ?? false;

  // Is zoom to visible scale button visible?
  const isZoomToVisibleScaleCapable = !isInVisibleRange && layerEntryType !== 'group';
  const isZoomToVisibleScaleButton = layerControls?.visibleScale ?? false;

  // Is zoom to layer button disabled?
  const isZoomToLayerDisabled = !isInVisibleRange || parentHidden || !isVisible || layerStatus === 'error';

  // Component helper
  const controls = useControlActions(layerPath);
  const subTitle = useSubtitle(layerPath, layerChildren || [], layerItems || []);

  return (
    <Stack direction="row" alignItems="center" sx={sxClasses.layerStackIcons}>
      {!!subTitle.length && <Typography fontSize={14}>{subTitle}</Typography>}
      <Box sx={{ ...sxClasses.subtitle, display: 'flex', alignItems: 'center' }}>
        {/* Button to select layer in panel and scroll to footer
            Hidden in WCAG mode - keyboard users can Tab to layer panel instead
          */}
        {hasLayersTab && !isFocusTrap && (
          <Box sx={sxClasses.buttonDivider}>
            <IconButton
              tooltip={t('legend.selectLayerAndScroll')}
              aria-label={`${t('legend.selectLayerAndScroll')} - ${layerName}`}
              className="buttonOutline"
              onClick={handleNavigateToLayers}
            >
              <LayersIcon />
            </IconButton>
          </Box>
        )}
        {isZoomToVisibleScaleButton && (
          <IconButton
            edge="end"
            tooltip={t('layers.zoomVisibleScale')}
            aria-label={`${t('layers.zoomVisibleScale')} - ${layerName}`} // WCAG - // WCAG - Provide descriptive aria-label for screen readers
            aria-disabled={!isZoomToVisibleScaleCapable}
            className={`buttonOutline`}
            onClick={controls.handleZoomToLayerVisibleScale}
          >
            <CenterFocusScaleIcon />
          </IconButton>
        )}
        {isLayerVisibleCapable && (
          <IconButton
            edge={isInVisibleRange ? false : 'end'}
            tooltip={t('layers.toggleVisibility')}
            aria-label={`${t('layers.toggleVisibility')} - ${layerName}`} // WCAG - Provide descriptive aria-label for screen readers
            aria-pressed={isVisible} // WCAG - used instead of disabled to allow button to retain focus after keyboard press
            aria-disabled={!isInVisibleRange || parentHidden || layerStatus === 'error'}
            className="buttonOutline"
            onClick={controls.handleToggleVisibility}
          >
            {isVisible ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
          </IconButton>
        )}
        {isLayerHighlightCapable && (
          <IconButton
            tooltip={t('legend.highlightLayer')}
            aria-label={`${t('legend.highlightLayer')} - ${layerName}`} // WCAG - Provide descriptive aria-label for icon button tooltips
            aria-pressed={highlightedLayer === layerPath}
            aria-disabled={!isInVisibleRange || parentHidden || !isVisible || layerStatus === 'error'}
            className="buttonOutline"
            onClick={controls.handleHighlightLayer}
          >
            {highlightedLayer === layerPath ? <HighlightIcon /> : <HighlightOutlinedIcon />}
          </IconButton>
        )}
        {isLayerZoomToExtentCapable && (
          <IconButton
            tooltip={t('legend.zoomTo')}
            aria-label={`${t('legend.zoomTo')} - ${layerName}`} // WCAG - Provide descriptive aria-label for icon button tooltips
            aria-disabled={isZoomToLayerDisabled} // WCAG - used instead of disabled to allow button to retain focus after keyboard press
            className="buttonOutline"
            onClick={controls.handleZoomTo}
          >
            <ZoomInSearchIcon />
          </IconButton>
        )}
      </Box>
    </Stack>
  );
}
