import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { delay } from '@/core/utils/utilities';
import {
  Box,
  BrowserNotSupportedIcon,
  CheckBoxIcon,
  CheckBoxOutlineBlankIcon,
  Divider,
  Fade,
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

import { useUIController } from '@/core/controllers/use-controllers';
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
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useStoreUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';
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

import {
  useStoreMapVisibleLayers,
  useStoreMapIsLayerHiddenOnMap,
  useStoreMapLayerVisibility,
  useStoreMapIsParentLayerHiddenOnMap,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import {
  useStoreTimeSliderLayers,
  setStoreTimeSliderSelectedLayerPath,
} from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { useNavigateToTab } from '@/core/components/common/hooks/use-navigate-to-tab';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { DeleteUndoButton } from '@/core/components/layers/delete-undo-button';
import type { TypeContainerBox } from '@/core/types/global-types';
import { useLayerController, useLayerSetController } from '@/core/controllers/use-controllers';

// TODO: WCAG Issue #3108 - Fix layers.moreInfo button (button nested within a button)
// TODO: WCAG Issue #3108 - Check all disabled buttons. They may need special treatment. Need to find instance in UI first)
// TODO: WCAG Issue #3108 - Check all icon buttons for "state related" aria values (i.e aria-checked, aria-disabled, etc.)

interface LayerDetailsProps {
  layerPath: string;
  containerType: TypeContainerBox;
}

interface SubLayerProps {
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
  const { t } = useTranslation<string>();

  // Hooks
  const layerName = useStoreLayerName(layerPath);
  const childPaths = useStoreLayerChildPaths(layerPath);
  const layerHidden = useStoreMapIsLayerHiddenOnMap(layerPath);
  const parentHidden = useStoreMapIsParentLayerHiddenOnMap(layerPath);
  const layerVisible = useStoreMapLayerVisibility(layerPath);
  const layerController = useLayerController();

  // Return the ui
  return (
    <>
      <ListItem>
        <IconButton
          color="primary"
          role="checkbox"
          onClick={() => layerController.setOrToggleMapLayerVisibility(layerPath)}
          disabled={parentHidden}
          aria-checked={layerVisible === true}
          aria-label={layerVisible ? t('layers.hideLayer', { name: layerName }) : t('layers.showLayer', { name: layerName })}
          tooltipPlacement="left"
        >
          {layerVisible ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
        </IconButton>
        <LayerIcon layerPath={layerPath} />
        <Box
          component="span"
          sx={{ ...sxClasses.tableIconLabel, ...(layerHidden && { color: theme.palette.grey[600], fontStyle: 'italic' }) }}
        >
          {layerName}
        </Box>
      </ListItem>
      {childPaths && (
        <Box sx={{ paddingLeft: '30px', width: '100%' }}>
          <List>
            {childPaths.map((childPath) => (
              <Sublayer key={childPath} layerPath={childPath} />
            ))}
          </List>
        </Box>
      )}
    </>
  );
});

Sublayer.displayName = 'Sublayer';

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
  const visibleLayers = useStoreMapVisibleLayers();
  const datatableSettings = useStoreDataTableLayerSettings();
  const layersData = useStoreDataTableAllFeaturesDataArray();
  const bounds = useStoreLayerBounds(layerPath);
  const layerVisible = useStoreMapLayerVisibility(layerPath);
  const parentHidden = useStoreMapIsParentLayerHiddenOnMap(layerPath);
  const layerHidden = useStoreMapIsLayerHiddenOnMap(layerPath);
  const availableSettings = useStoreLayerStyleSettings(layerPath);
  const timeSliderLayers = useStoreTimeSliderLayers();
  const isFocusTrap = useStoreUIActiveTrapGeoView();
  const uiController = useUIController();
  const layerController = useLayerController();
  const layerSetController = useLayerSetController();

  // Use navigate hook for time slider (only if time slider state exists)
  const navigateToTimeSlider = useNavigateToTab('time-slider', setStoreTimeSliderSelectedLayerPath);

  // Is highlight button disabled?
  const isLayerHighlightCapable = layerControls?.highlight;

  // Is zoom to extent button disabled?
  const isLayerZoomToExtentCapable = layerControls?.zoom;

  // Generate unique table details button ID
  const tableDetailsButtonId = `table-details-${containerType}-${mapId}`;

  // Reset view to details when layer changes
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYER DETAILS - reset activeView on layer change', layerPath);
    setActiveView('details');
  }, [layerPath]);

  const handleResetLayer = (): void => {
    layerController.resetLayer(layerPath).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in layerController.resetLayer in layer-details.handleResetLayer', error);
    });
  };

  const handleZoomTo = (): void => {
    layerController.zoomToLayerExtent(layerPath).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in zoomToLayerExtent in layer-details.handleZoomTo', error);
    });
  };

  const handleOpenTable = (): void => {
    // trigger the fetching of the features when not available OR when layer status is in error
    if (
      !layersData.filter((layers) => layers.layerPath === layerPath && !!layers?.features?.length).length ||
      layerStatus === LAYER_STATUS.ERROR
    ) {
      layerSetController.triggerGetAllFeatureInfo(layerPath).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('Failed to triggerGetAllFeatureInfo in single-layer.handleLayerClick', error);
      });
    }
    uiController.enableFocusTrap({ activeElementId: 'layerDataTable', callbackElementId: tableDetailsButtonId });
  };

  const handleHighlightLayer = (): void => {
    layerController.setHighlightLayer(layerPath);
  };

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
          if (!visibleLayers.includes(child.layerPath)) layerController.setOrToggleMapLayerVisibility(child.layerPath, true);
        } else if (visibleLayers.includes(child.layerPath)) layerController.setOrToggleMapLayerVisibility(child.layerPath, false);
        if (child.children.length) setRecursive(child, newVisibility);
      });
    };
    setRecursive(layer, !allSublayersVisible);
  }, [allSublayersVisible, mapId, layerPath, layerController, visibleLayers]);

  const allItemsChecked = !!(layerItems && layerItems.every((i) => i.isVisible !== false));

  const renderItemCheckbox = (item: TypeLegendItem): JSX.Element | null => {
    if (!layerStyleConfig) return null;

    // No checkbox for simple style layers
    if (layerStyleConfig[item.geometryType]?.type === 'simple') return null;

    // GV: Some esri layer has uniqueValue renderer but there is no field defined in their metadata (i.e. e2424b6c-db0c-4996-9bc0-2ca2e6714d71).
    // For these layers, we need to disable checkboxes
    if (layerStyleConfig[item.geometryType]?.fields[0] === undefined) return null;

    if (!layerCanToggle) {
      return (
        <IconButton disabled role="checkbox" aria-label={t('layers.visibilityIsAlways')} aria-checked={false} tooltipPlacement="left">
          <CheckBoxIcon color="disabled" />
        </IconButton>
      );
    }

    return (
      <IconButton
        role="checkbox"
        color="primary"
        aria-label={item.isVisible ? t('layers.hideClass', { name: item.name }) : t('layers.showClass', { name: item.name })}
        aria-checked={item.isVisible === true}
        tooltipPlacement="left"
        onClick={() => layerController.toggleItemVisibilityAndForget(layerPath, item)}
        disabled={layerHidden}
      >
        {item.isVisible === true ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
      </IconButton>
    );
  };

  const renderHeaderCheckbox = (): JSX.Element => {
    if (!layerCanToggle) {
      return (
        <IconButton disabled role="checkbox" aria-label={t('layers.visibilityIsAlways')} aria-checked={false} tooltipPlacement="left">
          <CheckBoxIcon color="disabled" />
        </IconButton>
      );
    }

    return (
      <IconButton
        color="primary"
        role="checkbox"
        aria-label={allItemsChecked ? t('layers.hideAllLayers') : t('layers.showAllLayers')}
        aria-checked={allItemsChecked}
        tooltipPlacement="left"
        onClick={() => layerController.setAllItemsVisibilityAndForget(layerPath, !allItemsChecked)}
        disabled={layerHidden}
      >
        {allItemsChecked ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
      </IconButton>
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
          <Grid
            container
            direction="row"
            key={`${layerPath}/${item.name}`}
            alignItems="center"
            justifyItems="stretch"
            sx={{ display: 'flex', flexWrap: 'nowrap', marginBottom: '5px' }}
          >
            <Grid size={{ xs: 'auto' }}>{renderItemCheckbox(item)}</Grid>
            <Grid size={{ xs: 'grow' }} sx={{ display: 'flex' }}>
              {item.icon ? (
                <Box component="img" sx={{ alignSelf: 'center', maxHeight: '26px', maxWidth: '26px' }} alt={item.name} src={item.icon} />
              ) : (
                <BrowserNotSupportedIcon />
              )}
              <Box component="span" sx={{ ...sxClasses.tableIconLabel, ...((layerHidden || !item.isVisible) && hiddenStyle) }}>
                {item.name}
              </Box>
            </Grid>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderDetailsButton = (): JSX.Element => {
    const isDisabled = layerControls?.table === false || layerHidden || parentHidden;

    return (
      <IconButton
        id={tableDetailsButtonId}
        aria-label={isDisabled ? t('layers.tableViewNone') : t('legend.tableDetails')}
        className="buttonOutline"
        onClick={handleOpenTable}
        disabled={isDisabled}
      >
        <TableViewIcon color={isDisabled ? 'disabled' : 'inherit'} />
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
          aria-label={t('layers.selectLayerAndScrollTimeSlider')}
          className="buttonOutline"
          onClick={(event) => {
            event.stopPropagation();
            navigateToTimeSlider({ layerPath });
          }}
          disabled={isDisabled}
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
        <IconButton aria-label={t('legend.highlightLayer')} onClick={handleHighlightLayer} className="buttonOutline" disabled={layerHidden}>
          {highlightedLayer === layerPath ? <HighlightIcon /> : <HighlightOutlinedIcon />}
        </IconButton>
      );
    return null;
  };

  const renderZoomButton = (): JSX.Element | null => {
    if (isLayerZoomToExtentCapable)
      return (
        <IconButton
          aria-label={t('legend.zoomTo')}
          onClick={handleZoomTo}
          className="buttonOutline"
          disabled={layerHidden || bounds === undefined || Number.isNaN(bounds[0])}
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
          aria-label={t('layers.settings.back')}
          className="buttonOutline"
          onClick={handleSettingsBackToDetails}
          tooltipPlacement="bottom"
        >
          <ArrowBackIcon />
        </IconButton>
      );
    }

    return (
      <IconButton
        iconRef={settingsButtonRef}
        aria-label={t('layers.settings.title')}
        className="buttonOutline"
        onClick={handleOpenSettings}
        tooltipPlacement="bottom"
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
          aria-label={t('layers.settings.back')}
          className="buttonOutline"
          onClick={handleInfoBackToDetails}
          tooltipPlacement="bottom"
        >
          <ArrowBackIcon />
        </IconButton>
      );
    }

    return (
      <IconButton
        iconRef={infoButtonRef}
        aria-label={t('layers.moreInfo')}
        className="buttonOutline"
        onClick={handleOpenInfo}
        tooltipPlacement="bottom"
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
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {hasDataTable && renderDetailsButton()}
        {timeSliderButton}
        {showDivider && <Box sx={sxClasses.verticalDivider} />}
        <IconButton aria-label={t('legend.resetLayer')} className="buttonOutline" onClick={handleResetLayer}>
          <RestartAltIcon />
        </IconButton>
        {renderHighlightButton()}
        {renderZoomButton()}
        {deleteButton && <Box sx={sxClasses.verticalDivider} />}
        {deleteButton}
      </Box>
    );
  };

  const subTitle = ((): string | null => {
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
        <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, [theme.breakpoints.down('sm')]: { display: 'none' } }}>
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
                {layerItems &&
                  layerItems.length > 1 &&
                  layerItems.some((item) => layerStyleConfig?.[item.geometryType]?.fields[0] !== undefined) && (
                    <Grid container direction="row" alignItems="center" justifyItems="stretch">
                      <Grid size={{ xs: 'auto' }}>{renderHeaderCheckbox()}</Grid>
                      <Grid size={{ xs: 'auto' }}>
                        <Box component="span" sx={{ fontWeight: 'bold', ...(layerHidden && hiddenStyle) }}>
                          {t('layers.toggleItemsVisibility')}
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                {layerChildPaths && layerChildPaths.length > 0 && (
                  <Grid container direction="row" alignItems="center" justifyItems="stretch">
                    <Grid size={{ xs: 'auto' }}>
                      <IconButton
                        role="checkbox"
                        aria-label={allSublayersVisible ? t('layers.hideAllLayers') : t('layers.showAllLayers')}
                        aria-checked={allSublayersVisible}
                        tooltipPlacement="left"
                        color="primary"
                        onClick={handleToggleAllVisibility}
                        disabled={layerHidden}
                      >
                        {allSublayersVisible ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                      </IconButton>
                    </Grid>
                    <Grid size={{ xs: 'auto' }}>
                      <Box component="span" sx={{ fontWeight: 'bold', ...(layerHidden && hiddenStyle) }}>
                        {t('layers.toggleSublayersVisibility')}
                      </Box>
                    </Grid>
                  </Grid>
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
