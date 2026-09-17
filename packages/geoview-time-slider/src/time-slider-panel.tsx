import type { TypeWindow } from 'geoview-core/core/types/global-types';
import type { LayerListEntry, LayoutExposedMethods } from 'geoview-core/core/components/common';
import { Layout } from 'geoview-core/core/components/common';
import type { TypeDisplayLanguage } from 'geoview-core/api/types/map-schema-types';
import type { TypeTimeSliderValues } from 'geoview-core/core/stores/states/time-slider-state';
import { useStoreTimeSliderLayers, useStoreTimeSliderSelectedLayerPath } from 'geoview-core/core/stores/states/time-slider-state';
import { useStoreAppDisplayLanguage } from 'geoview-core/core/stores/states/app-state';
import {
  useStoreLayerAllVisibleAndInRangeLayers,
  useStoreLayerDateTemporalModeSet,
  useStoreLayerDisplayDateFormatSet,
  useStoreLayerDisplayDateTimezoneSet,
  useStoreLayerInVisibleRangeSet,
  useStoreLayerIsHiddenOnMapSet,
  useStoreLayerNameSet,
  useStoreLayerStatusSet,
} from 'geoview-core/core/stores/states/layer-state';
import { Box } from 'geoview-core/ui';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { logger } from 'geoview-core/core/utils/logger';
import { CONTAINER_TYPE, TABS } from 'geoview-core/core/utils/constant';

import { DateMgt } from 'geoview-core/core/utils/date-mgt';
import { TimeSlider } from './time-slider';
import { useTimeSliderController } from 'geoview-core/core/controllers/use-controllers';

/** Properties for the TimeSliderPanel component. */
interface TypeTimeSliderProps {
  mapId: string;
}

/**
 * Time slider tab.
 *
 * @param props - The properties passed to slider
 * @returns The time slider tab
 */
export function TimeSliderPanel(props: TypeTimeSliderProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-time-slider/time-slider-panel');

  const { mapId } = props;
  const { cgpv } = window as TypeWindow;
  const { reactUtilities } = cgpv;
  const { useCallback, useMemo, useEffect, useRef, useState } = reactUtilities.react;

  const layoutRef = useRef<LayoutExposedMethods | null>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);

  // get values from store
  const displayLanguage = useStoreAppDisplayLanguage();
  const { t } = useTranslation<string>();
  const layerHiddenSet = useStoreLayerIsHiddenOnMapSet();
  const inVisibleRangeSet = useStoreLayerInVisibleRangeSet();
  const visibleInRangeLayers = useStoreLayerAllVisibleAndInRangeLayers();
  const layerNames = useStoreLayerNameSet();
  const layerStatuses = useStoreLayerStatusSet();
  const layerDisplayDateFormats = useStoreLayerDisplayDateFormatSet();
  const layerDisplayDateTimezones = useStoreLayerDisplayDateTimezoneSet();
  const layerTemporalModes = useStoreLayerDateTemporalModeSet();
  const timeSliderLayers = useStoreTimeSliderLayers()!;
  const selectedLayerPath = useStoreTimeSliderSelectedLayerPath();
  const timeSliderController = useTimeSliderController();

  // #region Handlers

  /**
   * Handles when the user clicks on a layer in the layer list.
   */
  const handleClickLayerList = useCallback(
    (layer: LayerListEntry): void => {
      // Set the layer path
      timeSliderController.setSelectedLayerPathTimeSlider(layer.layerPath);
    },
    [timeSliderController]
  );

  /**
   * Handles panel close requests from the TimeSlider component.
   */
  const handleRequestClose = useCallback((): void => {
    layoutRef.current?.closeRightPanel();
  }, []);

  /**
   * Handles when the panel fullscreen state changes.
   */
  const handleFullScreenChanged = useCallback((fullscreen: boolean): void => {
    setIsFullScreen(fullscreen);
  }, []);

  /**
   * Gets dates for current filters.
   *
   * @param layerPath - The layer path
   * @param timeSliderLayerInfo - Time slider layer info
   * @param language - The display language
   * @returns The formatted date string or undefined
   */
  const getFilterInfo = useCallback(
    (layerPath: string, timeSliderLayerInfo: TypeTimeSliderValues, language: TypeDisplayLanguage): string | undefined => {
      if (timeSliderLayerInfo.filtering) {
        const { values } = timeSliderLayerInfo;

        // Read the display date format
        return DateMgt.formatDateOrDateRange(
          values[0],
          timeSliderLayerInfo.displayDateFormat ?? layerDisplayDateFormats[layerPath],
          language,
          timeSliderLayerInfo.displayDateTimezone ?? layerDisplayDateTimezones[layerPath],
          timeSliderLayerInfo.serviceDateTemporalMode ?? layerTemporalModes[layerPath],
          values?.[1]
        );
      }

      return undefined;
    },
    [layerDisplayDateFormats, layerDisplayDateTimezones, layerTemporalModes]
  );

  // #endregion

  // Reacts when the array of layer data updates
  const memoLayersList = useMemo(() => {
    // Log
    logger.logTraceUseMemo('TIME-SLIDER-PANEL - memoLayersList', timeSliderLayers);

    /**
     * Creates layer tooltip.
     *
     * @param layerPath - The layer path
     * @param timeSliderLayerInfo - Time slider layer info
     * @param language - The display language
     * @param name - Time slider layer name
     * @returns The tooltip JSX element
     */
    const getLayerTooltip = (
      layerPath: string,
      timeSliderLayerInfo: TypeTimeSliderValues,
      language: TypeDisplayLanguage,
      name: string
    ): JSX.Element => {
      return (
        <Box sx={{ display: 'flex', alignContent: 'center', '& svg ': { width: '0.75em', height: '0.75em' } }}>
          {name}
          {timeSliderLayerInfo.filtering && `: ${getFilterInfo(layerPath, timeSliderLayerInfo, language) ?? ''}`}
        </Box>
      );
    };

    // Return the layers
    return visibleInRangeLayers
      .map((layerPath) => {
        return { layerPath, timeSliderLayerInfo: timeSliderLayers?.[layerPath] };
      })
      .filter((layer) => {
        if (!layer?.timeSliderLayerInfo || !layer.timeSliderLayerInfo.isMainLayerPath) {
          return false;
        }

        // Check if layer is in error
        if (layerStatuses[layer.layerPath] === 'error') {
          return false;
        }

        // Collect every layer path backing this time slider entry (main + any additional layers)
        const relatedLayerPaths = [layer.layerPath, ...(layer.timeSliderLayerInfo.additionalLayerpaths ?? [])];

        // Keep out-of-scale-range entries filtered out: exclude only when every related layer is out of range
        const anyInRange = relatedLayerPaths.some((layerPath) => inVisibleRangeSet[layerPath] !== false);
        return anyInRange;
      })
      .map((layer) => {
        const additionalNames = layer.timeSliderLayerInfo.additionalLayerpaths
          ?.map((additionalLayerPath) => {
            return layerNames[additionalLayerPath];
          })
          .filter(Boolean);

        const combinedAdditionalNames = additionalNames ? `, ${additionalNames.join(', ')}` : '';
        const layerName = layer.timeSliderLayerInfo.title || `${layerNames[layer.layerPath]}${combinedAdditionalNames}` || '';

        // The entry is hidden only when every related layer is hidden on the map (an untracked layer, e.g. one
        // not shown in the legend, counts as hidden so a custom time slider collapses once all its layers are off)
        const relatedLayerPaths = [layer.layerPath, ...(layer.timeSliderLayerInfo.additionalLayerpaths ?? [])];
        const isHidden = relatedLayerPaths.every((relatedPath) => layerHiddenSet[relatedPath] !== false);

        return {
          layerName,
          layerPath: layer.layerPath,
          layerFeatures: getFilterInfo(layer.layerPath, layer.timeSliderLayerInfo, displayLanguage),
          tooltip: getLayerTooltip(layer.layerPath, layer.timeSliderLayerInfo, displayLanguage, layerName),
          layerStatus: 'loaded',
          queryStatus: 'processed',
          layerUniqueId: `${mapId}-${TABS.TIME_SLIDER}-${layer.layerPath}`,
          isHidden,
          relatedLayerPaths,
        } satisfies LayerListEntry;
      });
  }, [
    timeSliderLayers,
    visibleInRangeLayers,
    getFilterInfo,
    layerStatuses,
    layerNames,
    layerHiddenSet,
    inVisibleRangeSet,
    displayLanguage,
    mapId,
  ]);

  /**
   * Unselects the layer when it leaves the list or becomes hidden so the right panel returns to the guide.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER-PANEL - check selected layer visibility');

    if (!selectedLayerPath) return;

    const selectedEntry = memoLayersList.find((layer) => layer.layerPath === selectedLayerPath);

    // Clear the selection when the active layer is gone (out of range) or now hidden; renderContent then returns
    // null and the shared layout auto-shows the guide (consistent with the details, geochart and data-table panels)
    if (!selectedEntry || selectedEntry.isHidden) {
      timeSliderController.setSelectedLayerPathTimeSlider('');
    }
  }, [timeSliderController, selectedLayerPath, memoLayersList]);

  /**
   * Renders the right panel content based on selected Layer path of time slider.
   *
   * NOTE: Here we return null, so that in responsive grid layout, it can be used as flag to render the guide for time slider.
   *
   * @returns The rendered content or null
   */
  const renderContent = (): JSX.Element | null => {
    if (selectedLayerPath && timeSliderLayers && selectedLayerPath in timeSliderLayers) {
      return (
        <TimeSlider layerPath={selectedLayerPath} onRequestClose={handleRequestClose} isFullScreen={isFullScreen} key={selectedLayerPath} />
      );
    }

    return null;
  };

  return (
    <Layout
      ref={layoutRef}
      selectedLayerPath={selectedLayerPath}
      onLayerListClicked={handleClickLayerList}
      layerList={memoLayersList}
      guideContentIds={['timeSlider']}
      containerType={CONTAINER_TYPE.FOOTER_BAR}
      titleFullscreen={t('timeSlider.title')}
      onFullScreenChanged={handleFullScreenChanged}
    >
      {renderContent()}
    </Layout>
  );
}
