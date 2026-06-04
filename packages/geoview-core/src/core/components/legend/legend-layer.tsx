import { memo, useCallback, useId, useMemo, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material';

import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { Box, ListItem, ListItemText, IconButton, KeyboardArrowDownIcon, KeyboardArrowUpIcon, ProgressBar } from '@/ui';
import { Typography } from '@/ui/typography/typography';
import {
  useStoreLayerChildPaths,
  useStoreLayerItems,
  useStoreLayerName,
  useStoreLayerStatus,
  useStoreLayerSchemaTag,
  useStoreLayerIsHiddenOnMap,
  useStoreLayerLegendCollapsed,
  useStoreLayerStyleConfig,
  useStoreLayerIcons,
} from '@/core/stores/states/layer-state';
import { useLightBox } from '@/core/components/common';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { layerHasClassItems, layerHasLegendImage } from '@/core/components/layers/types';
import { SecondaryControls } from './legend-layer-ctrl';
import { CollapsibleContent } from './legend-layer-container';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';
import type { TypeContainerBox } from '@/core/types/global-types';
import { useLayerController } from '@/core/controllers/use-controllers';

export interface LegendLayerProps {
  layerPath: string;
  showControls: boolean;
  containerType: TypeContainerBox;
}

interface LegendLayerHeaderProps {
  layerPath: string;
  tooltip: string;
  onExpandClick: (event: React.MouseEvent) => void;
  sxClasses: ReturnType<typeof getSxClasses>;
  showControls: boolean;
  layerNameId: string;
  collapseContainerId: string;
}

/**
 * Renders the legend layer header with expand/collapse control.
 *
 * Memoized to avoid re-rendering when parent legend state changes but this layer's
 * specific props (layerPath, tooltip, sxClasses, etc.) remain unchanged.
 *
 * @param props - Properties defined in LegendLayerHeaderProps interface
 * @returns The legend layer header component
 */
const LegendLayerHeader = memo(
  ({
    layerPath,
    tooltip,
    onExpandClick,
    sxClasses,
    showControls,
    layerNameId,
    collapseContainerId,
  }: LegendLayerHeaderProps): JSX.Element => {
    // Log
    logger.logTraceRender('components/legend/legend-layer - LegendLayerHeader', layerPath);

    // Hooks
    const isCollapsed = useStoreLayerLegendCollapsed(layerPath);
    const layerHidden = useStoreLayerIsHiddenOnMap(layerPath);
    const layerName = useStoreLayerName(layerPath) ?? layerPath;
    const layerItems = useStoreLayerItems(layerPath);
    const layerStyleConfig = useStoreLayerStyleConfig(layerPath);
    const layerChildPaths = useStoreLayerChildPaths(layerPath);
    const layerIcons = useStoreLayerIcons(layerPath);
    const schemaTag = useStoreLayerSchemaTag(layerPath);
    const layerStatus = useStoreLayerStatus(layerPath);

    // Has at least 2 layer items and style config
    const hasMoreThanOneItemsAndStyle = layerHasClassItems(layerItems, layerStyleConfig, 2);

    // If the layer has a legend image
    const hasLegendImage = layerHasLegendImage(schemaTag, layerItems, layerIcons, layerStyleConfig);

    // If the layer has child layers
    const hasChildren = layerChildPaths && layerChildPaths.length > 0;

    // Return the ui
    return (
      <Box
        key={layerPath}
        sx={sxClasses.legendListItemHeader}
        className={`legendListItemHeader${layerHidden || layerStatus === 'error' ? ' outOfRange' : ''}`}
      >
        <LayerIcon layerPath={layerPath} />
        <ListItemText
          primary={
            <Typography component="div" id={layerNameId}>
              {layerName}
            </Typography>
          }
          sx={sxClasses.legendTitle}
          className="legendTitle"
          disableTypography
          secondary={showControls ? <SecondaryControls layerPath={layerPath} /> : undefined}
        />
        {showControls && (hasLegendImage || hasMoreThanOneItemsAndStyle || hasChildren) && (
          <IconButton
            className="buttonOutline"
            onClick={onExpandClick}
            edge="end"
            size="small"
            tooltip={tooltip}
            aria-label={`${tooltip} - ${layerName}`} // WCAG - Provide descriptive aria-label for icon button tooltips
            aria-expanded={!isCollapsed} // WCAG - Indicate expanded/collapsed state with aria-expanded
            aria-controls={!isCollapsed ? collapseContainerId : undefined} // WCAG - Link button to collapsible content using aria-controls and matching IDs
          >
            {!isCollapsed ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        )}
      </Box>
    );
  }
);

LegendLayerHeader.displayName = 'LegendLayerHeader';

/**
 * Renders a layer entry in the legend with collapsible content.
 *
 * Triggers screen reader announcements when layer status changes between
 * loading/loaded/error states via ARIA live regions.
 */
export function LegendLayer({ layerPath, showControls, containerType }: LegendLayerProps): JSX.Element {
  // Log
  logger.logTraceRender('components/legend/legend-layer', layerPath);

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  /** Memoized sx class definitions for the legend layer. */
  const memoSxClasses = useMemo(() => {
    logger.logTraceUseMemo('LEGEND-LAYER - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // Stores
  const mapId = useStoreGeoViewMapId();
  const id = useId(); // WCAG - Generate a stable unique ID
  const layerNameId = `${mapId}-${containerType}-layer-name-${id}`; // WCAG - IDs to link the layer name to icon buttons related to it (aria-describedby)
  const collapseContainerId = `${mapId}-${containerType}-collapse-${id}`; // WCAG - IDs to link collapse buttons to collapsible content related to it (aria-controls)
  const layerStatus = useStoreLayerStatus(layerPath);
  const layerName = useStoreLayerName(layerPath) ?? layerPath;
  const { initLightBox, LightBoxComponent } = useLightBox();
  const layerController = useLayerController();

  // Internal state
  const prevStatusRef = useRef<string | undefined>(undefined); // Ref to track previous status for status change detection
  const [statusMessage, setStatusMessage] = useState<string>('');

  /**
   * Handles click on the layer expand/collapse toggle button.
   */
  const handleExpandGroupClick = useCallback(
    (event: React.MouseEvent): void => {
      event.stopPropagation();

      // Toggle the legend collapse
      layerController.toggleLegendCollapsed(layerPath);
    },
    [layerPath, layerController]
  );

  /**
   * WCAG - Tracks layer status changes for screen reader announcements.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LEGEND-LAYER - WCAG track layer status changes', layerStatus);

    // Check if previous state was an in-progress state (loading or processing)
    const prevStateWasInProgress = prevStatusRef.current === 'loading' || prevStatusRef.current === 'processing';

    if (layerStatus === 'loading' && prevStatusRef.current !== 'loading') {
      // Announce when loading starts
      setStatusMessage(t('layers.status.layerLoadingDescriptive', { layerName }) || '');
      prevStatusRef.current = layerStatus;
    } else if (layerStatus === 'processing' && prevStatusRef.current !== 'processing') {
      // Announce when processing starts
      setStatusMessage(t('layers.status.layerProcessingDescriptive', { layerName }) || '');
      prevStatusRef.current = layerStatus;
    } else if (layerStatus === 'loaded' && prevStateWasInProgress) {
      // Announce when loading or processing completes successfully
      setStatusMessage(t('layers.status.layerLoadedDescriptive', { layerName }) || '');
      prevStatusRef.current = layerStatus;
    } else if (layerStatus === 'error' && prevStateWasInProgress) {
      // Announce when loading or processing fails
      setStatusMessage(t('layers.status.layerErrorDescriptive', { layerName }) || '');
      prevStatusRef.current = layerStatus;
    } else {
      // Update ref for any other status changes
      prevStatusRef.current = layerStatus;
    }
  }, [layerStatus, layerName, t]);

  return (
    <ListItem className="legendListItem" sx={memoSxClasses.legendListItem} key={layerPath}>
      <LegendLayerHeader
        layerPath={layerPath}
        tooltip={t('layers.toggleCollapse')}
        onExpandClick={handleExpandGroupClick}
        sxClasses={memoSxClasses}
        showControls={showControls}
        layerNameId={layerNameId}
        collapseContainerId={collapseContainerId}
      />
      {/* WCAG - ARIA live region for screen reader announcements */}
      <Box sx={memoSxClasses.visuallyHidden} role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </Box>
      {layerStatus === 'loading' && (
        <Box sx={memoSxClasses.loading}>
          <ProgressBar aria-label={t('layers.status.layerLoadingDescriptive', { layerName })} />
        </Box>
      )}

      <CollapsibleContent
        layerPath={layerPath}
        initLightBox={initLightBox}
        LegendLayerComponent={LegendLayer}
        showControls={showControls}
        containerType={containerType}
        collapseContainerId={collapseContainerId}
        layerNameId={layerNameId}
      />
      <LightBoxComponent />
    </ListItem>
  );
}
