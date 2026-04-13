import type { TypeWindow } from 'geoview-core/core/types/global-types';
import type { LayerListEntry } from 'geoview-core/core/components/common';
import { Layout } from 'geoview-core/core/components/common';
import type { TypeDisplayLanguage } from 'geoview-core/api/types/map-schema-types';
import type { TypeTimeSliderValues } from 'geoview-core/core/stores/store-interface-and-intial-values/time-slider-state';
import {
  useStoreTimeSliderLayers,
  useStoreTimeSliderSelectedLayerPath,
} from 'geoview-core/core/stores/store-interface-and-intial-values/time-slider-state';
import { useStoreAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import {
  useStoreLayerAllVisibleAndInRangeLayers,
  useStoreLayerDateTemporalModeSet,
  useStoreLayerDisplayDateFormatSet,
  useStoreLayerDisplayDateTimezoneSet,
  useStoreLayerIsHiddenOnMapSet,
  useStoreLayerNameSet,
  useStoreLayerStatusSet,
} from 'geoview-core/core/stores/store-interface-and-intial-values/layer-state';
import { Box } from 'geoview-core/ui';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
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
  const { useCallback, useMemo, useEffect } = reactUtilities.react;

  // get values from store
  const displayLanguage = useStoreAppDisplayLanguage();
  const layerHiddenSet = useStoreLayerIsHiddenOnMapSet();
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
   * Handles Layer list when clicked on each layer.
   *
   * @param layer - Layer clicked by the user
   */
  const handleClickLayerList = useCallback(
    (layer: LayerListEntry) => {
      // Set the layer path
      timeSliderController.setSelectedLayerPathTimeSlider(layer.layerPath);
    },
    [timeSliderController]
  );

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

        // Check if main layer is hidden (includes out of scale check)
        const mainLayerHidden = layerHiddenSet[layer.layerPath];

        // For custom time slider with additional layers, check if any additional layer is visible
        if (layer.timeSliderLayerInfo.additionalLayerpaths && layer.timeSliderLayerInfo.additionalLayerpaths.length > 0) {
          const hasVisibleAdditionalLayer = layer.timeSliderLayerInfo.additionalLayerpaths.some((layerPath) => !layerHiddenSet[layerPath]);

          // Show if main layer is visible OR any additional layer is visible
          if (mainLayerHidden && !hasVisibleAdditionalLayer) {
            return false;
          }
        } else {
          // No additional layers, just check main layer
          if (mainLayerHidden) {
            return false;
          }
        }

        // Check if layer is in error
        if (layerStatuses[layer.layerPath] === 'error') {
          return false;
        }

        return true;
      })
      .map((layer) => {
        const additionalNames = layer.timeSliderLayerInfo.additionalLayerpaths
          ?.map((additionalLayerPath) => {
            return layerNames[additionalLayerPath];
          })
          .filter(Boolean);

        const combinedAdditionalNames = additionalNames ? `, ${additionalNames.join(', ')}` : '';
        const layerName = layer.timeSliderLayerInfo.title || `${layerNames[layer.layerPath]}${combinedAdditionalNames}` || '';
        return {
          layerName,
          layerPath: layer.layerPath,
          layerFeatures: getFilterInfo(layer.layerPath, layer.timeSliderLayerInfo, displayLanguage),
          tooltip: getLayerTooltip(layer.layerPath, layer.timeSliderLayerInfo, displayLanguage, layerName),
          layerStatus: 'loaded',
          queryStatus: 'processed',
          layerUniqueId: `${mapId}-${TABS.TIME_SLIDER}-${layer.layerPath}`,
        } as LayerListEntry;
      });
  }, [timeSliderLayers, visibleInRangeLayers, getFilterInfo, layerStatuses, layerNames, layerHiddenSet, displayLanguage, mapId]);

  /**
   * Unselects the layer if it's removed from the visibility array.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER-PANEL - check selected layer visibility');

    if (selectedLayerPath && !memoLayersList.some((layer) => layer.layerPath === selectedLayerPath)) {
      // Selected layer is no longer in the visible layers list, unselect it
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
      return <TimeSlider layerPath={selectedLayerPath} key={selectedLayerPath} />;
    }

    return null;
  };

  return (
    <Layout
      selectedLayerPath={selectedLayerPath}
      onLayerListClicked={handleClickLayerList}
      layerList={memoLayersList}
      guideContentIds={['timeSlider']}
      containerType={CONTAINER_TYPE.FOOTER_BAR}
      titleFullscreen={getLocalizedMessage(displayLanguage, 'timeSlider.title')}
    >
      {renderContent()}
    </Layout>
  );
}
