import { Fragment, memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import type { TypeLegendLayer, TypeLegendItem } from '@/core/components/layers/types';
import { getSxClasses } from './layer-details-style';
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
import {
  useLayerHighlightedLayer,
  useLayerSelectorBounds,
  useLayerSelectorHasText,
  useLayerStoreActions,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useUIStoreActions, useUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';
import {
  useDataTableAllFeaturesDataArray,
  useDataTableLayerSettings,
  useDataTableStoreActions,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { LayerOpacityControl } from './layer-opacity-control/layer-opacity-control';
import { LayerSettingsPanel } from './layer-settings/layer-settings';
import { LayerInfoPanel } from './layer-info/layer-info';
import { logger } from '@/core/utils/logger';
import { LAYER_STATUS, TABS, TIMEOUT } from '@/core/utils/constant';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';

import {
  useMapVisibleLayers,
  useMapSelectorIsLayerHiddenOnMap,
  useMapSelectorLayerVisibility,
  useMapStoreActions,
  useMapSelectorLayerParentHidden,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { useTimeSliderLayers, useTimeSliderStoreActions } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { useNavigateToTab } from '@/core/components/common/hooks/use-navigate-to-tab';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { DeleteUndoButton } from '@/core/components/layers/delete-undo-button';
import type { TypeContainerBox } from '@/core/types/global-types';

// TODO: WCAG Issue #3108 - Fix layers.moreInfo button (button nested within a button)
// TODO: WCAG Issue #3108 - Check all disabled buttons. They may need special treatment. Need to find instance in UI first)
// TODO: WCAG Issue #3108 - Check all icon buttons for "state related" aria values (i.e aria-checked, aria-disabled, etc.)

interface LayerDetailsProps {
  layerDetails: TypeLegendLayer;
  containerType: TypeContainerBox;
}

interface SubLayerProps {
  layer: TypeLegendLayer;
}

// Memoized Sublayer Component
const Sublayer = memo(({ layer }: SubLayerProps): JSX.Element => {
  // Log
  logger.logTraceRender('components/layers/right-panel/Sublayer');

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { t } = useTranslation<string>();

  // Hooks
  const layerHidden = useMapSelectorIsLayerHiddenOnMap(layer.layerPath);
  const parentHidden = useMapSelectorLayerParentHidden(layer.layerPath);
  const layerVisible = useMapSelectorLayerVisibility(layer.layerPath);
  const { setOrToggleLayerVisibility } = useMapStoreActions();

  // Return the ui
  return (
    <ListItem>
      <IconButton
        color="primary"
        role="checkbox"
        onClick={() => setOrToggleLayerVisibility(layer.layerPath)}
        disabled={parentHidden}
        aria-checked={layerVisible === true}
        aria-label={layerVisible ? t('layers.hideLayer', { name: layer.layerName }) : t('layers.showLayer', { name: layer.layerName })}
        tooltipPlacement="left"
      >
        {layerVisible ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
      </IconButton>
      <LayerIcon layerPath={layer.layerPath} />
      <Box
        component="span"
        sx={{ ...sxClasses.tableIconLabel, ...(layerHidden && { color: theme.palette.grey[600], fontStyle: 'italic' }) }}
      >
        {layer.layerName}
      </Box>
    </ListItem>
  );
});

Sublayer.displayName = 'Sublayer';

export function LayerDetails(props: LayerDetailsProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-details');

  const { layerDetails, containerType } = props;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const hiddenStyle = { color: theme.palette.grey[600], fontStyle: 'italic' };

  const [allSublayersVisible, setAllSublayersVisible] = useState(true);
  const [contentVisible, setContentVisible] = useState(true);
  const [activeView, setActiveView] = useState<'details' | 'settings' | 'info'>('details');

  // Ref for settings button focus restoration
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const mapId = useGeoViewMapId();

  // get store actions
  const highlightedLayer = useLayerHighlightedLayer();
  const { setAllItemsVisibility, toggleItemVisibility, setHighlightLayer, refreshLayer, zoomToLayerExtent, getLayerSettings } =
    useLayerStoreActions();
  const availableSettings = getLayerSettings(layerDetails.layerPath);
  const hasText = useLayerSelectorHasText(layerDetails.layerPath);
  const { setOrToggleLayerVisibility } = useMapStoreActions();
  const { enableFocusTrap } = useUIStoreActions();
  const { triggerGetAllFeatureInfo } = useDataTableStoreActions();
  const visibleLayers = useMapVisibleLayers();
  const datatableSettings = useDataTableLayerSettings();
  const layersData = useDataTableAllFeaturesDataArray();
  const bounds = useLayerSelectorBounds(layerDetails.layerPath);
  const layerVisible = useMapSelectorLayerVisibility(layerDetails.layerPath);
  const parentHidden = useMapSelectorLayerParentHidden(layerDetails.layerPath);
  const layerHidden = useMapSelectorIsLayerHiddenOnMap(layerDetails.layerPath);
  const timeSliderLayers = useTimeSliderLayers();
  const timeSliderActions = useTimeSliderStoreActions();
  const isFocusTrap = useUIActiveTrapGeoView();

  // Use navigate hook for time slider (only if time slider state exists)
  const navigateToTimeSlider = useNavigateToTab(
    'time-slider',
    timeSliderActions ? (layerPath: string) => timeSliderActions.setSelectedLayerPath(layerPath) : undefined
  );

  // Is highlight button disabled?
  const isLayerHighlightCapable = layerDetails.controls?.highlight;

  // Is zoom to extent button disabled?
  const isLayerZoomToExtentCapable = layerDetails.controls?.zoom;

  // Generate unique table details button ID
  const tableDetailsButtonId = `table-details-${containerType}-${mapId}`;

  // Reset view to details when layer changes
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYER DETAILS - reset activeView on layer change', layerDetails.layerPath);
    setActiveView('details');
  }, [layerDetails.layerPath]);

  /**
   * Recursively checks if all children of a layer are visible.
   * @param {TypeLegendLayer} legendLayer - The legend layer to check
   * @param {string[]} curVisibleLayers - The visible layers array
   * @returns {boolean} Whether the children are visible
   */
  const legendLayersChildrenVisible = useCallback((legendLayer: TypeLegendLayer, curVisibleLayers: string[]): boolean => {
    // Log
    logger.logTraceUseCallback('LAYER-DETAILS - legendLayersChildrenVisible');

    // Check if any children are not visible
    if (legendLayer.children.find((child) => !curVisibleLayers.includes(child.layerPath))) return false;

    // Check if any of the children have a child that is not visible
    const invisibleChildren = legendLayer.children.find((child) => {
      return child.children?.length && !legendLayersChildrenVisible(child, curVisibleLayers);
    });

    if (invisibleChildren) return false;
    return true;
  }, []);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYER DETAILS - allChildrenVisible', layerDetails);

    const allChildrenVisible = legendLayersChildrenVisible(layerDetails, visibleLayers);
    if (allChildrenVisible !== allSublayersVisible) setAllSublayersVisible(allChildrenVisible);
  }, [allSublayersVisible, layerDetails, layerDetails.children, legendLayersChildrenVisible, visibleLayers]);

  const handleRefreshLayer = (): void => {
    refreshLayer(layerDetails.layerPath).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in refreshLayer in layer-details.handleRefreshLayer', error);
    });
  };

  const handleZoomTo = (): void => {
    zoomToLayerExtent(layerDetails.layerPath).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in zoomToLayerExtent in layer-details.handleZoomTo', error);
    });
  };

  const handleOpenTable = (): void => {
    // trigger the fetching of the features when not available OR when layer status is in error
    if (
      !layersData.filter((layers) => layers.layerPath === layerDetails.layerPath && !!layers?.features?.length).length ||
      layerDetails.layerStatus === LAYER_STATUS.ERROR
    ) {
      triggerGetAllFeatureInfo(layerDetails.layerPath).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('Failed to triggerGetAllFeatureInfo in single-layer.handleLayerClick', error);
      });
    }
    enableFocusTrap({ activeElementId: 'layerDataTable', callbackElementId: tableDetailsButtonId });
  };

  const handleHighlightLayer = (): void => {
    setHighlightLayer(layerDetails.layerPath);
  };

  /**
   * Crossfades from settings view back to details view, restoring focus to the settings button.
   */
  const handleSettingsBackToDetails = useCallback((): void => {
    logger.logTraceUseCallback('LAYER-DETAILS - handleSettingsBackToDetails');
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
    logger.logTraceUseCallback('LAYER-DETAILS - handleOpenSettings');
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
    logger.logTraceUseCallback('LAYER-DETAILS - handleInfoBackToDetails');
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
    logger.logTraceUseCallback('LAYER-DETAILS - handleOpenInfo');
    setContentVisible(false);
    delay(TIMEOUT.fadingPanelDuration)
      .then(() => {
        setActiveView('info');
        setContentVisible(true);
      })
      .catch((error) => logger.logPromiseFailed('in delay in handleOpenInfo', error));
  }, []);

  /**
   * Recursively sets child layer visibility.
   * @param {TypeLegendLayer} legendLayer - The legend layer to set the child visibility of
   * @param {boolean} newVisibility - The new visibility to set
   */
  const setVisibilityForAllSublayers = useCallback(
    (legendLayer: TypeLegendLayer, newVisibility: boolean): void => {
      // Log
      logger.logTraceUseCallback('LAYER-DETAILS - setVisibilityForAllSublayers');

      legendLayer.children.forEach((child) => {
        if (newVisibility) {
          if (!visibleLayers.includes(child.layerPath)) setOrToggleLayerVisibility(child.layerPath, true);
        } else if (visibleLayers.includes(child.layerPath)) setOrToggleLayerVisibility(child.layerPath, false);
        if (child.children.length) setVisibilityForAllSublayers(child, newVisibility);
      });
    },
    [setOrToggleLayerVisibility, visibleLayers]
  );

  /**
   * Sets visibility for all children of the layer.
   */
  const handleToggleAllVisibility = useCallback((): void => {
    setVisibilityForAllSublayers(layerDetails, !allSublayersVisible);
  }, [allSublayersVisible, layerDetails, setVisibilityForAllSublayers]);

  const allItemsChecked = (): boolean => {
    return layerDetails.items.every((i) => i.isVisible !== false);
  };

  function renderItemCheckbox(item: TypeLegendItem): JSX.Element | null {
    // First check if styleConfig exists
    if (!layerDetails.styleConfig) {
      return null;
    }

    // No checkbox for simple style layers
    if (layerDetails.styleConfig[item.geometryType]?.type === 'simple') return null;

    // GV: Some esri layer has uniqueValue renderer but there is no field defined in their metadata (i.e. e2424b6c-db0c-4996-9bc0-2ca2e6714d71).
    // For these layers, we need to disable checkboxes
    if (layerDetails.styleConfig[item.geometryType]?.fields[0] === undefined) return null;

    if (!layerDetails.canToggle) {
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
        onClick={() => toggleItemVisibility(layerDetails.layerPath, item)}
        disabled={layerHidden}
      >
        {item.isVisible === true ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
      </IconButton>
    );
  }

  function renderHeaderCheckbox(): JSX.Element {
    if (!layerDetails.canToggle) {
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
        aria-label={allItemsChecked() ? t('layers.hideAllLayers') : t('layers.showAllLayers')}
        aria-checked={allItemsChecked() === true}
        tooltipPlacement="left"
        onClick={() => setAllItemsVisibility(layerDetails.layerPath, !allItemsChecked())}
        disabled={layerHidden}
      >
        {allItemsChecked() ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
      </IconButton>
    );
  }

  function renderItems(): JSX.Element {
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
        {layerDetails.items.map((item) => (
          <Grid
            container
            direction="row"
            key={`${item.name}/${layerDetails.items.indexOf(item)}`}
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
  }

  function renderSubLayers(startLayer: TypeLegendLayer): JSX.Element {
    return (
      <List>
        {startLayer.children.map((layer) => (
          <Fragment key={layer.layerId}>
            <Sublayer layer={layer} />
            {layer.children.length > 0 && <Box sx={{ paddingLeft: '30px', width: '100%' }}>{renderSubLayers(layer)}</Box>}
          </Fragment>
        ))}
      </List>
    );
  }

  function renderDetailsButton(): JSX.Element {
    const isDisabled = layerDetails.controls?.table === false || layerHidden || parentHidden;

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
  }

  function renderTimeSliderButton(): JSX.Element | null {
    // Check if layer is in time slider
    const isLayerInTimeSlider = timeSliderLayers && timeSliderLayers[layerDetails.layerPath];
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
            navigateToTimeSlider({ layerPath: layerDetails.layerPath });
          }}
          disabled={isDisabled}
        >
          <TimeSliderIcon color={isDisabled ? 'disabled' : 'inherit'} />
        </IconButton>
      );
    }
    return null;
  }

  function renderHighlightButton(): JSX.Element | null {
    if (isLayerHighlightCapable)
      return (
        <IconButton aria-label={t('legend.highlightLayer')} onClick={handleHighlightLayer} className="buttonOutline" disabled={layerHidden}>
          {highlightedLayer === layerDetails.layerPath ? <HighlightIcon /> : <HighlightOutlinedIcon />}
        </IconButton>
      );
    return null;
  }

  function renderZoomButton(): JSX.Element | null {
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
  }

  function renderDeleteButton(): JSX.Element | null {
    // Only render delete button if layer is removable (controls.remove must be explicitly true)
    const isRemovable = layerDetails.controls?.remove ?? false;
    if (!isRemovable) return null;

    return (
      <DeleteUndoButton
        key={`delete-undo-${layerDetails.layerPath}`}
        layerPath={layerDetails.layerPath}
        layerRemovable={isRemovable}
        focusTargetIdAfterDelete={`${mapId}-${containerType}-${TABS.LAYERS}-panel-close-btn`}
      />
    );
  }

  function renderSettingsButton(): JSX.Element | null {
    const hasInteraction = layerDetails.controls?.hover || layerDetails.controls?.query;
    if (!availableSettings?.length && !hasInteraction && !hasText) return null;

    if (activeView === 'settings') {
      return (
        <IconButton
          ref={settingsButtonRef}
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
        ref={settingsButtonRef}
        aria-label={t('layers.settings.title')}
        className="buttonOutline"
        onClick={handleOpenSettings}
        tooltipPlacement="bottom"
      >
        <SettingsIcon />
      </IconButton>
    );
  }

  function renderInfoButton(): JSX.Element {
    if (activeView === 'info') {
      return (
        <IconButton
          ref={infoButtonRef}
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
        ref={infoButtonRef}
        aria-label={t('layers.moreInfo')}
        className="buttonOutline"
        onClick={handleOpenInfo}
        tooltipPlacement="bottom"
      >
        <InfoOutlinedIcon />
      </IconButton>
    );
  }

  function renderLayerButtons(): JSX.Element {
    const timeSliderButton = renderTimeSliderButton();
    const hasDataTable = datatableSettings[layerDetails.layerPath];
    const deleteButton = renderDeleteButton();
    const showDivider = hasDataTable || timeSliderButton;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {hasDataTable && renderDetailsButton()}
        {timeSliderButton}
        {showDivider && <Box sx={sxClasses.verticalDivider} />}
        <IconButton aria-label={t('legend.refreshLayer')} className="buttonOutline" onClick={handleRefreshLayer}>
          <RestartAltIcon />
        </IconButton>
        {renderHighlightButton()}
        {renderZoomButton()}
        {deleteButton && <Box sx={sxClasses.verticalDivider} />}
        {deleteButton}
      </Box>
    );
  }

  const getSubTitle = (): string | null => {
    if (parentHidden) return t('layers.parentHidden');
    if (!layerVisible) return t('layers.hidden');
    if (layerDetails.children.length > 0) {
      return t('legend.subLayersCount').replace('{count}', layerDetails.children.length.toString());
    }
    const count = layerDetails.items.filter((d) => d.isVisible !== false).length;
    const totalCount = layerDetails.items.length;

    if (totalCount <= 1) {
      return null;
    }
    return t('legend.itemsCount').replace('{count}', count.toString()).replace('{totalCount}', totalCount.toString());
  };

  const renderWMSImage = (): JSX.Element | null => {
    if (
      layerDetails.schemaTag === CONST_LAYER_TYPES.WMS &&
      layerDetails.icons.length &&
      layerDetails.icons[0].iconImage &&
      layerDetails.icons[0].iconImage !== 'no data'
    ) {
      return (
        <Grid sx={sxClasses.itemsGrid}>
          <Grid container pt={6} pb={6}>
            <Box component="img" alt="" src={layerDetails.icons[0].iconImage} sx={sxClasses.wmsImage} />
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
      {layerDetails !== undefined && (
        <>
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
              <Typography sx={{ ...sxClasses.categoryTitle, ...(layerHidden && hiddenStyle) }} title={layerDetails.layerName}>
                {layerDetails.layerName}
              </Typography>
              {(() => {
                const subTitle = getSubTitle();
                return (
                  subTitle && (
                    <Typography
                      sx={{
                        fontSize: theme.palette.geoViewFontSize.sm,
                        ...(layerHidden && hiddenStyle),
                      }}
                    >
                      {' '}
                      {subTitle}{' '}
                    </Typography>
                  )
                );
              })()}
            </Box>
            {renderSettingsButton()}
            {renderInfoButton()}
          </Box>

          {/* Sequential crossfade: fade out → swap content → fade in */}
          <Fade in={contentVisible} timeout={TIMEOUT.fadingPanelDuration}>
            <Box>
              {activeView === 'details' && (
                <>
                  {renderLayerButtons()}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap-reverse' }}>
                    {layerDetails.items.length > 1 &&
                      layerDetails.items.some((item) => layerDetails.styleConfig?.[item.geometryType]?.fields[0] !== undefined) && (
                        <Grid container direction="row" alignItems="center" justifyItems="stretch">
                          <Grid size={{ xs: 'auto' }}>{renderHeaderCheckbox()}</Grid>
                          <Grid size={{ xs: 'auto' }}>
                            <Box component="span" sx={{ fontWeight: 'bold', ...(layerHidden && hiddenStyle) }}>
                              {t('layers.toggleItemsVisibility')}
                            </Box>
                          </Grid>
                        </Grid>
                      )}
                    {layerDetails.children.length > 0 && (
                      <Grid container direction="row" alignItems="center" justifyItems="stretch">
                        <Grid size={{ xs: 'auto' }}>
                          <IconButton
                            role="checkbox"
                            aria-label={allSublayersVisible ? t('layers.hideAllLayers') : t('layers.showAllLayers')}
                            aria-checked={allSublayersVisible === true}
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
                    {layerDetails.controls?.opacity !== false && <LayerOpacityControl layerDetails={layerDetails} />}
                  </Box>
                  <Divider sx={{ height: 'auto', marginTop: '10px', marginBottom: '10px' }} variant="middle" />
                  {renderWMSImage()}
                  <Box>
                    {layerDetails.items?.length > 0 && renderItems()}
                    {layerDetails.children.length > 0 && renderSubLayers(layerDetails)}
                  </Box>
                  <Divider sx={{ height: 'auto', marginTop: '10px', marginBottom: '10px' }} variant="middle" />
                  {layerDetails.layerAttribution &&
                    layerDetails.layerAttribution.map((attribution) => {
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
              {activeView === 'settings' && <LayerSettingsPanel layerDetails={layerDetails} />}
              {activeView === 'info' && <LayerInfoPanel layerDetails={layerDetails} />}
            </Box>
          </Fade>
        </>
      )}
    </Paper>
  );
}
