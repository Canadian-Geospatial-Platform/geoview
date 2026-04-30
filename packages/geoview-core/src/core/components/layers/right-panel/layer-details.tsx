import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { delay } from '@/core/utils/utilities';
import {
  Box,
  BrowserNotSupportedIcon,
  Checkbox,
  Divider,
  Fade,
  FormControlLabel,
  Grid,
  HighlightIcon,
  HighlightOutlinedIcon,
  IconButton,
  InfoOutlinedIcon,
  List,
  ListItem,
  Paper,
  RestartAltIcon,
  TableViewIcon,
  TimeSliderIcon,
  Typography,
  SettingsIcon,
  ZoomInSearchIcon,
} from '@/ui';
import { ArrowBackIcon } from '@/ui/icons';
import { useTimeSliderControllerIfExists, useUIController, useDataTableController } from '@/core/controllers/use-controllers';
import type { TypeLegendItem } from '@/core/components/layers/types';
import { getSxClasses } from './layer-details-style';
import {
  getStoreLayerLegendLayerByPath,
  useStoreLayerHighlightedLayer,
  useStoreLayerBounds,
  useStoreLayerHasText,
  useStoreLayerStyleSettings,
  useStoreLayerAllChildrenVisible,
  useStoreLayerChildPaths,
  useStoreLayerControls,
  useStoreLayerStatus,
  useStoreLayerItems,
  useStoreLayerStyleConfig,
  useStoreLayerCanToggle,
  useStoreLayerName,
  useStoreLayerSchemaTag,
  useStoreLayerIcons,
  useStoreLayerAttribution,
  useStoreLayerVisible,
  useStoreLayerIsParentHiddenOnMap,
  useStoreLayerIsHiddenOnMap,
  useStoreLayerVisibleLayers,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import {
  useStoreUIActiveTrapGeoView,
  useStoreUIFooterBarComponents,
  useStoreUIAppbarComponents,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import {
  useStoreDataTableAllFeaturesDataArray,
  useStoreDataTableLayerSettings,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { LayerOpacityControl } from './layer-opacity-control/layer-opacity-control';
import { LayerSettingsPanel } from './layer-settings/layer-settings';
import { LayerInfoPanel } from './layer-info/layer-info';
import { logger } from '@/core/utils/logger';
import { LAYER_STATUS, TABS, TIMEOUT } from '@/core/utils/constant';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { useStoreTimeSliderLayers } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { useNavigateToTab } from '@/core/components/common/hooks/use-navigate-to-tab';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { DeleteUndoButton } from '@/core/components/layers/delete-undo-button';
import type { TypeContainerBox } from '@/core/types/global-types';
import { useLayerController, useLayerSetController } from '@/core/controllers/use-controllers';

interface LayerDetailsProps {
  /** The layer path for the layer to display. */
  layerPath: string;
  /** The type of container for the layer details panel. */
  containerType: TypeContainerBox;
}

interface SubLayerProps {
  /** The layer path for the sublayer to render. */
  layerPath: string;
}

/**
 * Renders a single sublayer item with visibility toggle.
 *
 * Memoized to avoid re-rendering all sublayer items when only one changes.
 * Self-recursive: renders its own children if present.
 */
const Sublayer = memo(function Sublayer({ layerPath }: SubLayerProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/Sublayer');

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Hooks
  const layerName = useStoreLayerName(layerPath);
  const childPaths = useStoreLayerChildPaths(layerPath);
  const layerHidden = useStoreLayerIsHiddenOnMap(layerPath);
  const parentHidden = useStoreLayerIsParentHiddenOnMap(layerPath);
  const layerVisible = useStoreLayerVisible(layerPath);
  const layerController = useLayerController();

  // Return the ui
  return (
    <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', p: 0 }}>
      <FormControlLabel
        sx={sxClasses.formControlLabelFull}
        control={
          <Checkbox
            color="primary"
            checked={layerVisible === true}
            onChange={() => layerController.setOrToggleLayerVisibility(layerPath)}
            disabled={parentHidden}
          />
        }
        label={
          <Box sx={sxClasses.checkboxLabelContent}>
            <LayerIcon layerPath={layerPath} />
            <Box
              component="span"
              sx={{ ...sxClasses.tableIconLabel, ...(layerHidden && { color: theme.palette.grey[600], fontStyle: 'italic' }) }}
            >
              {layerName}
            </Box>
          </Box>
        }
      />
      {childPaths && (
        <Box sx={{ paddingLeft: '30px', width: '100%' }}>
          <List>
            {childPaths.map((childPath) => (
              <Sublayer key={childPath} layerPath={childPath} />
            ))}
          </List>
        </Box>
      )}
    </ListItem>
  );
});

Sublayer.displayName = 'Sublayer';

/**
 * Creates the layer details panel with settings, info, and visibility controls.
 *
 * @param props - Properties defined in LayerDetailsProps interface
 * @returns The layer details panel element, or null if layer not found
 */

export function LayerDetails(props: LayerDetailsProps): JSX.Element | null {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-details');

  const { layerPath, containerType } = props;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const hiddenStyle = { color: theme.palette.grey[600], fontStyle: 'italic' };

  const [contentVisible, setContentVisible] = useState(true);
  const [activeView, setActiveView] = useState<'details' | 'settings' | 'info'>('details');

  // Ref for settings button focus restoration
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const infoButtonRef = useRef<HTMLButtonElement>(null);

  // get store state — individual hooks for precise reactivity
  const mapId = useStoreGeoViewMapId();
  const layerName = useStoreLayerName(layerPath);
  const layerControls = useStoreLayerControls(layerPath);
  const layerStatus = useStoreLayerStatus(layerPath);
  const layerItems = useStoreLayerItems(layerPath);
  const layerStyleConfig = useStoreLayerStyleConfig(layerPath);
  const layerCanToggle = useStoreLayerCanToggle(layerPath);
  const layerSchemaTag = useStoreLayerSchemaTag(layerPath);
  const layerIcons = useStoreLayerIcons(layerPath);
  const layerAttribution = useStoreLayerAttribution(layerPath);
  const layerChildPaths = useStoreLayerChildPaths(layerPath);
  const allSublayersVisible = useStoreLayerAllChildrenVisible(layerPath);
  const highlightedLayer = useStoreLayerHighlightedLayer();
  const hasText = useStoreLayerHasText(layerPath);
  const visibleLayers = useStoreLayerVisibleLayers();
  const datatableSettings = useStoreDataTableLayerSettings();
  const layersData = useStoreDataTableAllFeaturesDataArray();
  const bounds = useStoreLayerBounds(layerPath);
  const layerVisible = useStoreLayerVisible(layerPath);
  const parentHidden = useStoreLayerIsParentHiddenOnMap(layerPath);
  const layerHidden = useStoreLayerIsHiddenOnMap(layerPath);
  const availableSettings = useStoreLayerStyleSettings(layerPath);
  const timeSliderLayers = useStoreTimeSliderLayers();
  const isFocusTrap = useStoreUIActiveTrapGeoView();
  const footerBarComponents = useStoreUIFooterBarComponents();
  const appBarComponents = useStoreUIAppbarComponents();
  const uiController = useUIController();
  const layerController = useLayerController();
  const layerSetController = useLayerSetController();
  const timeSliderController = useTimeSliderControllerIfExists();
  const dataTableController = useDataTableController();

  // Check if data-table tab exists in footer or appBar
  const hasDataTableTab = footerBarComponents.includes('data-table') || appBarComponents.includes('data-table');

  // Use navigate hook for time slider (only if time slider state exists)
  const navigateToTimeSlider = useNavigateToTab('time-slider', (lyrPath) => {
    timeSliderController?.setSelectedLayerPathTimeSlider(lyrPath);
  });

  // Use navigate hook for data table
  const navigateToDataTable = useNavigateToTab('data-table', (lyrPath) => {
    dataTableController.setSelectedLayerPath(lyrPath);
  });

  // Is highlight button disabled?
  const isLayerHighlightCapable = layerControls?.highlight;

  // Is zoom to extent button capable?
  const isLayerZoomToExtentCapable = layerControls?.zoom;
  // Is zoom button disabled?
  const isZoomDisabled = layerHidden || bounds === undefined || Number.isNaN(bounds[0]);

  // Is table button disabled?
  const isTableButtonDisabled = layerControls?.table === false || layerHidden || parentHidden;

  // Generate unique table details button ID
  const tableDetailsButtonId = `${mapId}-${containerType}-table-details`;

  /**
   * Resets active view to details when layer changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYER DETAILS - reset activeView on layer change', layerPath);
    setActiveView('details');
  }, [layerPath]);

  // #region Handlers

  /**
   * Handles resetting the layer to its initial state.
   */
  const handleResetLayer = useCallback((): void => {
    layerController.resetLayer(layerPath).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in layerController.resetLayer in layer-details.handleResetLayer', error);
    });
  }, [layerController, layerPath]);

  /**
   * Handles zooming to the layer's extent.
   */
  const handleZoomTo = useCallback((): void => {
    // Early return if zoom button is disabled
    if (isZoomDisabled) {
      return;
    }
    layerController.zoomToLayerExtent(layerPath).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in zoomToLayerExtent in layer-details.handleZoomTo', error);
    });
  }, [isZoomDisabled, layerController, layerPath]);

  /**
   * Handles opening the data table for the layer.
   */
  const handleOpenTable = useCallback((): void => {
    // Early return if table button is disabled
    if (isTableButtonDisabled) {
      return;
    }
    // trigger the fetching of the features when not available OR when layer status is in error
    if (
      !layersData.filter((layers) => layers.layerPath === layerPath && !!layers?.features?.length).length ||
      layerStatus === LAYER_STATUS.ERROR
    ) {
      layerSetController.triggerGetAllFeatureInfo(layerPath).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('Failed to triggerGetAllFeatureInfo in layer-details.handleOpenTable', error);
      });
    }

    // If data-table tab exists in viewer, navigate to it directly
    if (hasDataTableTab) {
      navigateToDataTable({ layerPath });
    } else {
      // Otherwise, open the data table modal
      uiController.enableFocusTrap({ activeElementId: 'layerDataTable', callbackElementId: tableDetailsButtonId });
    }
  }, [
    isTableButtonDisabled,
    hasDataTableTab,
    navigateToDataTable,
    layerPath,
    layerSetController,
    layerStatus,
    layersData,
    tableDetailsButtonId,
    uiController,
  ]);

  /**
   * Handles highlighting the layer on the map.
   */
  const handleHighlightLayer = useCallback((): void => {
    // Early return if highlight button is disabled
    if (layerHidden) {
      return;
    }
    layerController.setHighlightLayer(layerPath);
  }, [layerController, layerHidden, layerPath]);

  /**
   * Handles navigation to the Time Slider panel when the button is clicked.
   */
  const handleTimeSliderNavigate = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      const isDisabled = layerHidden || parentHidden;
      if (isDisabled) {
        return;
      }
      event.stopPropagation();
      navigateToTimeSlider({ layerPath });
    },
    [layerHidden, parentHidden, navigateToTimeSlider, layerPath]
  );

  /**
   * Crossfades from settings view back to details view, restoring focus to the settings button.
   */
  const handleSettingsBackToDetails = useCallback((): void => {
    setContentVisible(false);
    delay(TIMEOUT.fadingPanelDuration)
      .then(() => {
        setActiveView('details');
        setContentVisible(true);
        requestAnimationFrame(() => settingsButtonRef.current?.focus());
      })
      .catch((error) => logger.logPromiseFailed('in delay in handleSettingsBackToDetails', error));
  }, []);

  /**
   * Crossfades from details view to settings view.
   */
  const handleOpenSettings = useCallback((): void => {
    setContentVisible(false);
    delay(TIMEOUT.fadingPanelDuration)
      .then(() => {
        setActiveView('settings');
        setContentVisible(true);
      })
      .catch((error) => logger.logPromiseFailed('in delay in handleOpenSettings', error));
  }, []);

  /**
   * Crossfades from info view back to details view, restoring focus to the info button.
   */
  const handleInfoBackToDetails = useCallback((): void => {
    setContentVisible(false);
    delay(TIMEOUT.fadingPanelDuration)
      .then(() => {
        setActiveView('details');
        setContentVisible(true);
        requestAnimationFrame(() => infoButtonRef.current?.focus());
      })
      .catch((error) => logger.logPromiseFailed('in delay in handleInfoBackToDetails', error));
  }, []);

  /**
   * Crossfades from details view to info view.
   */
  const handleOpenInfo = useCallback((): void => {
    setContentVisible(false);
    delay(TIMEOUT.fadingPanelDuration)
      .then(() => {
        setActiveView('info');
        setContentVisible(true);
      })
      .catch((error) => logger.logPromiseFailed('in delay in handleOpenInfo', error));
  }, []);

  /**
   * Sets visibility for all children of the layer.
   */
  const handleToggleAllVisibility = useCallback((): void => {
    // Use the non-reactive getter to walk the tree — only needed at click time
    const layer = getStoreLayerLegendLayerByPath(mapId, layerPath);
    if (!layer) return;

    const setRecursive = (legendLayer: typeof layer, newVisibility: boolean): void => {
      legendLayer.children.forEach((child) => {
        if (newVisibility) {
          if (!visibleLayers.includes(child.layerPath)) layerController.setOrToggleLayerVisibility(child.layerPath, true);
        } else if (visibleLayers.includes(child.layerPath)) layerController.setOrToggleLayerVisibility(child.layerPath, false);
        if (child.children.length) setRecursive(child, newVisibility);
      });
    };
    setRecursive(layer, !allSublayersVisible);
  }, [allSublayersVisible, mapId, layerPath, layerController, visibleLayers]);

  // #endregion Handlers

  const allItemsChecked = !!(layerItems && layerItems.every((i) => i.isVisible !== false));

  const renderItemCheckbox = (item: TypeLegendItem): JSX.Element | null => {
    if (!layerStyleConfig) return null;

    // No checkbox for simple style layers
    if (layerStyleConfig[item.geometryType]?.type === 'simple') return null;

    const isDisabled = layerHidden || !layerCanToggle;

    // Build the label content with icon and text
    const labelContent = (
      <Box sx={sxClasses.checkboxLabelContent}>
        {item.icon ? <Box component="img" alt="" src={item.icon} /> : <BrowserNotSupportedIcon sx={{ fontSize: '26px' }} />}
        <Box component="span" sx={{ ...sxClasses.tableIconLabel, ...((layerHidden || !item.isVisible) && hiddenStyle) }}>
          {item.name}
        </Box>
      </Box>
    );

    return (
      <FormControlLabel
        control={
          <Checkbox
            color="primary"
            checked={item.isVisible === true}
            onChange={() => layerController.toggleItemVisibilityAndForget(layerPath, item)}
            disabled={isDisabled}
          />
        }
        label={labelContent}
        sx={sxClasses.formControlLabelFull}
      />
    );
  };

  const renderHeaderCheckbox = (): JSX.Element => {
    const isDisabled = layerHidden || !layerCanToggle;

    const labelContent = (
      <Box component="span" sx={{ fontWeight: 'bold', ...(layerHidden && hiddenStyle) }}>
        {t('layers.toggleItemsVisibility')}
      </Box>
    );

    return (
      <FormControlLabel
        control={
          <Checkbox
            color="primary"
            checked={allItemsChecked}
            onChange={() => layerController.setAllItemsVisibilityAndForget(layerPath, !allItemsChecked)}
            disabled={isDisabled}
          />
        }
        label={labelContent}
        sx={sxClasses.formControlLabel}
      />
    );
  };

  const renderItems = (): JSX.Element => {
    return (
      <Grid
        className="layer-details-panel"
        container
        direction="column"
        spacing={0}
        sx={sxClasses.itemsGrid}
        justifyContent="left"
        justifyItems="stretch"
      >
        {layerItems?.map((item) => (
          <Grid key={`${layerPath}/${item.name}`} sx={{ marginBottom: '5px' }}>
            {renderItemCheckbox(item)}
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderDetailsButton = (): JSX.Element => {
    return (
      <IconButton
        id={tableDetailsButtonId}
        className="buttonOutline"
        onClick={handleOpenTable}
        aria-label={hasDataTableTab ? t('dataTable.accessAdvancedFunctions') : t('legend.tableDetails')}
        aria-disabled={isTableButtonDisabled} // WCAG - used instead of disabled to allow button to be discoverable by screen readers
      >
        <TableViewIcon color={isTableButtonDisabled ? 'disabled' : 'inherit'} />
      </IconButton>
    );
  };

  const renderTimeSliderButton = (): JSX.Element | null => {
    // Check if layer is in time slider
    const isLayerInTimeSlider = timeSliderLayers && timeSliderLayers[layerPath];
    const isDisabled = layerHidden || parentHidden;

    // Button to navigate to Time Slider panel and select this layer
    // Hidden in WCAG mode - keyboard users can Tab to Time Slider Panel instead
    // TODO: WCAG - Consider showing button in WCAG mode (requires re-working WCAG UX)
    if (isLayerInTimeSlider && !isFocusTrap) {
      return (
        <IconButton
          className="buttonOutline"
          onClick={handleTimeSliderNavigate}
          aria-label={t('layers.selectLayerAndScrollTimeSlider')}
          aria-disabled={isDisabled} // WCAG - used instead of disabled to allow button to be discoverable by screen readers
        >
          <TimeSliderIcon color={isDisabled ? 'disabled' : 'inherit'} />
        </IconButton>
      );
    }
    return null;
  };

  const renderHighlightButton = (): JSX.Element | null => {
    if (isLayerHighlightCapable)
      return (
        <IconButton
          onClick={handleHighlightLayer}
          className="buttonOutline"
          aria-label={t('legend.highlightLayer')}
          aria-disabled={layerHidden} // WCAG - used instead of disabled to allow button to be discoverable by screen readers
          aria-pressed={highlightedLayer === layerPath}
        >
          {highlightedLayer === layerPath ? <HighlightIcon /> : <HighlightOutlinedIcon />}
        </IconButton>
      );
    return null;
  };

  const renderZoomButton = (): JSX.Element | null => {
    if (isLayerZoomToExtentCapable)
      return (
        <IconButton
          onClick={handleZoomTo}
          className="buttonOutline"
          aria-disabled={isZoomDisabled} // WCAG - used instead of disabled to allow button to be discoverable by screen readers
          aria-label={t('legend.zoomTo')}
        >
          <ZoomInSearchIcon />
        </IconButton>
      );
    return null;
  };

  const renderDeleteButton = (): JSX.Element | null => {
    // Only render delete button if layer is removable (controls.remove must be explicitly true)
    const isRemovable = layerControls?.remove ?? false;
    if (!isRemovable) return null;

    return (
      <DeleteUndoButton
        key={`delete-undo-${layerPath}`}
        layerPath={layerPath}
        layerRemovable={isRemovable}
        focusTargetIdAfterDelete={`${mapId}-${containerType}-${TABS.LAYERS}-panel-close-btn`}
      />
    );
  };

  const renderSettingsButton = (): JSX.Element | null => {
    const hasInteraction = layerControls?.hover || layerControls?.query;
    if (!availableSettings?.length && !hasInteraction && !hasText) return null;

    if (activeView === 'settings') {
      return (
        <IconButton
          iconRef={settingsButtonRef}
          className="buttonOutline"
          onClick={handleSettingsBackToDetails}
          tooltipPlacement="bottom"
          aria-label={t('layers.settings.back')}
        >
          <ArrowBackIcon />
        </IconButton>
      );
    }

    return (
      <IconButton
        iconRef={settingsButtonRef}
        className="buttonOutline"
        onClick={handleOpenSettings}
        tooltipPlacement="bottom"
        aria-label={t('layers.settings.title')}
      >
        <SettingsIcon />
      </IconButton>
    );
  };

  const renderInfoButton = (): JSX.Element => {
    if (activeView === 'info') {
      return (
        <IconButton
          iconRef={infoButtonRef}
          className="buttonOutline"
          onClick={handleInfoBackToDetails}
          tooltipPlacement="bottom"
          aria-label={t('layers.settings.back')}
        >
          <ArrowBackIcon />
        </IconButton>
      );
    }

    return (
      <IconButton
        iconRef={infoButtonRef}
        className="buttonOutline"
        onClick={handleOpenInfo}
        tooltipPlacement="bottom"
        aria-label={t('layers.moreInfo')}
      >
        <InfoOutlinedIcon />
      </IconButton>
    );
  };

  const renderLayerButtons = (): JSX.Element => {
    const timeSliderButton = renderTimeSliderButton();
    const hasDataTable = datatableSettings[layerPath];
    const deleteButton = renderDeleteButton();
    const showDivider = hasDataTable || timeSliderButton;

    return (
      <Box
        role="group"
        sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px', flexWrap: 'wrap', justifyContent: 'flex-end' }}
        aria-label={t('layers.layerControls')!}
      >
        {hasDataTable && renderDetailsButton()}
        {timeSliderButton}
        {showDivider && <Box sx={sxClasses.verticalDivider} />}
        <IconButton className="buttonOutline" onClick={handleResetLayer} aria-label={t('legend.resetLayer')}>
          <RestartAltIcon />
        </IconButton>
        {renderHighlightButton()}
        {renderZoomButton()}
        {deleteButton && <Box sx={sxClasses.verticalDivider} />}
        {deleteButton}
      </Box>
    );
  };

  const subTitle: string | null = ((): string | null => {
    if (parentHidden) return t('layers.parentHidden');
    if (!layerVisible) return t('layers.hidden');
    if (layerChildPaths && layerChildPaths.length > 0) {
      return t('legend.subLayersCount').replace('{count}', layerChildPaths.length.toString());
    }
    const count = layerItems?.filter((d) => d.isVisible !== false).length ?? 0;
    const totalCount = layerItems?.length ?? 0;

    if (totalCount <= 1) {
      return null;
    }
    return t('legend.itemsCount').replace('{count}', count.toString()).replace('{totalCount}', totalCount.toString());
  })();

  const renderWMSImage = (): JSX.Element | null => {
    if (
      layerSchemaTag === CONST_LAYER_TYPES.WMS &&
      layerIcons?.length &&
      layerIcons[0].iconImage &&
      layerIcons[0].iconImage !== 'no data'
    ) {
      return (
        <Grid sx={sxClasses.itemsGrid}>
          <Grid container pt={6} pb={6}>
            <Box component="img" alt="" src={layerIcons[0].iconImage} sx={sxClasses.wmsImage} />
          </Grid>
        </Grid>
      );
    }

    return null;
  };

  // TODO: WCAG Issue #3116 - Consider using CSS rather than Divider for cleaner HTML structure
  // Render
  return (
    <Paper sx={sxClasses.layerDetails}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          alignItems: 'center',
          gap: '15px',
        }}
      >
        <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
          <Typography sx={{ ...sxClasses.categoryTitle, ...(layerHidden && hiddenStyle) }} title={layerName}>
            {layerName}
          </Typography>
          {subTitle && (
            <Typography
              sx={{
                fontSize: theme.palette.geoViewFontSize.sm,
                ...(layerHidden && hiddenStyle),
              }}
            >
              {subTitle}
            </Typography>
          )}
        </Box>
        {renderSettingsButton()}
        {renderInfoButton()}
      </Box>

      {/* Sequential crossfade: fade out → swap content → fade in */}
      <Fade in={contentVisible} timeout={TIMEOUT.fadingPanelDuration}>
        <Box>
          {activeView === TABS.DETAILS && (
            <>
              {renderLayerButtons()}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap-reverse' }}>
                {layerItems && layerItems.length > 1 && renderHeaderCheckbox()}
                {layerChildPaths && layerChildPaths.length > 0 && (
                  <FormControlLabel
                    control={
                      <Checkbox color="primary" checked={allSublayersVisible} onChange={handleToggleAllVisibility} disabled={layerHidden} />
                    }
                    label={
                      <Box component="span" sx={{ fontWeight: 'bold', ...(layerHidden && hiddenStyle) }}>
                        {t('layers.toggleSublayersVisibility')}
                      </Box>
                    }
                    sx={sxClasses.formControlLabel}
                  />
                )}
                {layerControls?.opacity !== false && <LayerOpacityControl layerPath={layerPath} />}
              </Box>
              <Divider sx={{ height: 'auto', marginTop: '10px', marginBottom: '10px' }} variant="middle" />
              {renderWMSImage()}
              <Box>
                {layerItems && layerItems.length > 0 && renderItems()}
                {layerChildPaths && layerChildPaths.length > 0 && (
                  <List>
                    {layerChildPaths.map((childPath) => (
                      <Sublayer key={childPath} layerPath={childPath} />
                    ))}
                  </List>
                )}
              </Box>
              <Divider sx={{ height: 'auto', marginTop: '10px', marginBottom: '10px' }} variant="middle" />
              {layerAttribution &&
                layerAttribution.map((attribution) => {
                  if (attribution) {
                    return (
                      <Typography
                        sx={{
                          marginTop: '10px',
                          color: theme.palette.geoViewColor.textColor.light[200],
                          fontSize: theme.palette.geoViewFontSize.sm,
                          textAlign: 'center',
                        }}
                        key={attribution}
                      >
                        {attribution.indexOf('©') === -1 ? `© ${attribution}` : attribution}
                      </Typography>
                    );
                  }
                  return null;
                })}
            </>
          )}
          {activeView === 'settings' && <LayerSettingsPanel layerPath={layerPath} />}
          {activeView === 'info' && <LayerInfoPanel layerPath={layerPath} />}
        </Box>
      </Fade>
    </Paper>
  );
}
