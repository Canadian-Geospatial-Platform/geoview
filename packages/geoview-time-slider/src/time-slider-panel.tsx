import type { TypeWindow } from 'geoview-core/core/types/global-types';
import type { LayerListEntry } from 'geoview-core/core/components/common';
import { Layout } from 'geoview-core/core/components/common';
import type { TypeDisplayLanguage } from 'geoview-core/api/types/map-schema-types';
import type { TypeTimeSliderValues } from 'geoview-core/core/stores/store-interface-and-intial-values/time-slider-state';
import {
  useTimeSliderLayers,
  useTimeSliderSelectedLayerPath,
  useTimeSliderStoreActions,
} from 'geoview-core/core/stores/store-interface-and-intial-values/time-slider-state';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useMapStoreActions, useMapAllVisibleandInRangeLayers } from 'geoview-core/core/stores/store-interface-and-intial-values/map-state';
import {
  useLayerDateTemporalModes,
  useLayerDisplayDateFormats,
  useLayerDisplayDateTimezones,
  useLayerLegendLayers,
} from 'geoview-core/core/stores/store-interface-and-intial-values/layer-state';
import { Box } from 'geoview-core/ui';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { logger } from 'geoview-core/core/utils/logger';
import { CONTAINER_TYPE, TABS } from 'geoview-core/core/utils/constant';

import { DateMgt } from 'geoview-core/core/utils/date-mgt';
import { TimeSlider } from './time-slider';
interface TypeTimeSliderProps {
  mapId: string;
}

/**
 * Time slider tab
 *
 * @param {TypeTimeSliderProps} props - The properties passed to slider
 * @returns {JSX.Element} The time slider tab
 */
export function TimeSliderPanel(props: TypeTimeSliderProps): JSX.Element {
  const { mapId } = props;
  const { cgpv } = window as TypeWindow;
  const { reactUtilities } = cgpv;
  const { useCallback, useMemo, useEffect } = reactUtilities.react;

  // get values from store
  const displayLanguage = useAppDisplayLanguage();
  const visibleInRangeLayers = useMapAllVisibleandInRangeLayers();
  // timeSliderLayers will always be present here, ! used to ignore possibility of it being undefined
  const timeSliderLayers = useTimeSliderLayers()!;
  const selectedLayerPath = useTimeSliderSelectedLayerPath();
  // TODO: evaluate why sometimes undefined, threat all stores as possibly undefined for plugins OR manage this higher up use !
  // TO.DOCONT: because return type is different then geochart store. We need to check existance of store easily for link component to work
  const { setSelectedLayerPath } = useTimeSliderStoreActions()!;
  const { isLayerHiddenOnMap } = useMapStoreActions();
  const legendLayers = useLayerLegendLayers();
  const layerDisplayDateFormats = useLayerDisplayDateFormats();
  const layerDisplayDateTimezones = useLayerDisplayDateTimezones();
  const layerTemporalModes = useLayerDateTemporalModes();

  /**
   * Handles Layer list when clicked on each layer.
   * @param {LayerListEntry} layer - layer clicked by the user.
   */
  const handleClickLayerList = useCallback(
    (layer: LayerListEntry) => {
      // Log
      logger.logTraceUseCallback('TIME-SLIDER-PANEL - handleLayerList');

      // Set the layer path
      setSelectedLayerPath?.(layer.layerPath);
    },
    [setSelectedLayerPath]
  );

  /**
   * Gets dates for current filters
   * @param {TypeTimeSliderValues} timeSliderLayerInfo - Time slider layer info.
   */
  const getFilterInfo = useCallback(
    (layerPath: string, timeSliderLayerInfo: TypeTimeSliderValues, language: TypeDisplayLanguage): string | null => {
      // Log
      logger.logTraceUseCallback('TIME-SLIDER-PANEL - getFilterInfo', layerPath, language);

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

      return null;
    },
    [layerDisplayDateFormats, layerDisplayDateTimezones, layerTemporalModes]
  );

  // Reacts when the array of layer data updates
  const memoLayersList = useMemo(() => {
    // Log
    logger.logTraceUseMemo('TIME-SLIDER-PANEL - memoLayersList', timeSliderLayers);

    /**
     * Create layer tooltip
     * @param {TypeTimeSliderValues} timeSliderLayerInfo Time slider layer info.
     * @param {string} name Time slider layer name.
     * @returns
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
          {timeSliderLayerInfo.filtering && `: ${getFilterInfo(layerPath, timeSliderLayerInfo, language)}`}
        </Box>
      );
    };

    /**
     * Recursively find a layer by path in legendLayers, searching through children
     * @param {string} targetPath - Layer path to find
     * @param {typeof legendLayers} layers - Array of legend layers to search
     * @returns {typeof legendLayers[number] | undefined} Found layer or undefined
     */
    const findLayerInLegend = (targetPath: string, layers: typeof legendLayers): (typeof legendLayers)[number] | undefined => {
      for (const layer of layers) {
        // Check if this is the layer we're looking for
        if (layer.layerPath === targetPath && (!layer.children || layer.children.length === 0)) {
          return layer;
        }

        // If this layer has children, search recursively in children
        if (layer.children && layer.children.length > 0) {
          const found = findLayerInLegend(targetPath, layer.children);
          if (found) {
            return found;
          }
        }
      }
      return undefined;
    };

    // Create lookup map by looping through timeSliderLayers and finding each in legendLayers
    const legendLayersMap = new Map<string, (typeof legendLayers)[number]>();
    Object.keys(timeSliderLayers).forEach((layerPath) => {
      const layer = findLayerInLegend(layerPath, legendLayers);
      if (layer) {
        legendLayersMap.set(layerPath, layer);
      }
    });

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
        const mainLayerHidden = isLayerHiddenOnMap(layer.layerPath);

        // For custom time slider with additional layers, check if any additional layer is visible
        if (layer.timeSliderLayerInfo.additionalLayerpaths && layer.timeSliderLayerInfo.additionalLayerpaths.length > 0) {
          const hasVisibleAdditionalLayer = layer.timeSliderLayerInfo.additionalLayerpaths.some(
            (layerPath) => !isLayerHiddenOnMap(layerPath)
          );
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
        const legendLayer = legendLayersMap.get(layer.layerPath);
        if (legendLayer?.layerStatus === 'error') {
          return false;
        }

        return true;
      })
      .map((layer) => {
        const legendLayer = legendLayersMap.get(layer.layerPath);
        const additionalNames = layer.timeSliderLayerInfo.additionalLayerpaths
          ?.map((additionalLayerPath) => {
            const additionalLayer = legendLayersMap.get(additionalLayerPath);
            return additionalLayer?.layerName;
          })
          .filter(Boolean);

        const combinedAdditionalNames = additionalNames ? `, ${additionalNames.join(', ')}` : '';
        const layerName = layer.timeSliderLayerInfo.title || `${legendLayer?.layerName || ''}${combinedAdditionalNames}` || '';
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
  }, [timeSliderLayers, visibleInRangeLayers, getFilterInfo, legendLayers, isLayerHiddenOnMap, displayLanguage, mapId]);

  // Unselect layer if it's removed from visibility array
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TIME-SLIDER-PANEL - check selected layer visibility');

    if (selectedLayerPath && !memoLayersList.some((layer) => layer.layerPath === selectedLayerPath)) {
      // Selected layer is no longer in the visible layers list, unselect it
      setSelectedLayerPath?.('');
    }
  }, [selectedLayerPath, memoLayersList, setSelectedLayerPath]);

  /**
   * Renders the right panel content based on selected Layer path of time slider.
   * NOTE: Here we return null, so that in responsive grid layout, it can be used as flag to render the guide for time slider.
   * @returns {JSX.Element | null} JSX.Element | null
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
