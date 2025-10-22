import type { TypeWindow } from 'geoview-core/core/types/global-types';
import type { LayerListEntry } from 'geoview-core/core/components/common';
import { Layout } from 'geoview-core/core/components/common';
import type { TypeTimeSliderValues } from 'geoview-core/core/stores/store-interface-and-intial-values/time-slider-state';
import {
  useTimeSliderLayers,
  useTimeSliderSelectedLayerPath,
  useTimeSliderStoreActions,
} from 'geoview-core/core/stores/store-interface-and-intial-values/time-slider-state';
import { useMapStoreActions, useMapAllVisibleandInRangeLayers } from 'geoview-core/core/stores/store-interface-and-intial-values/map-state';
import { useLayerLegendLayers } from 'geoview-core/core/stores/store-interface-and-intial-values/layer-state';
import { LegendEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/legend-event-processor';
import { Box } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { TABS } from 'geoview-core/core/utils/constant';

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
  const { useCallback, useMemo } = reactUtilities.react;

  // get values from store
  const visibleInRangeLayers = useMapAllVisibleandInRangeLayers();
  // timeSliderLayers will always be present here, ! used to ignore possibility of it being undefined
  const timeSliderLayers = useTimeSliderLayers()!;
  const selectedLayerPath = useTimeSliderSelectedLayerPath();
  const { setSelectedLayerPath } = useTimeSliderStoreActions();
  const { isLayerHiddenOnMap } = useMapStoreActions();
  const legendLayers = useLayerLegendLayers();

  /**
   * Handles Layer list when clicked on each layer.
   * @param {LayerListEntry} layer - layer clicked by the user.
   */
  const handleClickLayerList = useCallback(
    (layer: LayerListEntry) => {
      // Log
      logger.logTraceUseCallback('TIME-SLIDER-PANEL - handleLayerList');

      // Set the layer path
      setSelectedLayerPath(layer.layerPath);
    },
    [setSelectedLayerPath]
  );

  /**
   * Gets dates for current filters
   * @param {TypeTimeSliderValues} timeSliderLayerInfo - Time slider layer info.
   */
  const getFilterInfo = (timeSliderLayerInfo: TypeTimeSliderValues): string | null => {
    if (timeSliderLayerInfo.filtering) {
      const { values } = timeSliderLayerInfo;

      // Fill in date pattern and time pattern with default values if the display pattern is empty for some reason
      const [datePattern, timePattern] = timeSliderLayerInfo.displayPattern;

      return timeSliderLayerInfo.values.length === 1
        ? DateMgt.formatDatePattern(values[0], 'day', timePattern)
        : `${DateMgt.formatDatePattern(values[0], datePattern, timePattern)} / ${DateMgt.formatDatePattern(
            values[1],
            datePattern,
            timePattern
          )}`;
    }

    return null;
  };

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
    const getLayerTooltip = (timeSliderLayerInfo: TypeTimeSliderValues, name: string): JSX.Element => {
      return (
        <Box sx={{ display: 'flex', alignContent: 'center', '& svg ': { width: '0.75em', height: '0.75em' } }}>
          {name}
          {timeSliderLayerInfo.filtering && `: ${getFilterInfo(timeSliderLayerInfo)}`}
        </Box>
      );
    };

    // Return the layers
    return visibleInRangeLayers
      .map((layerPath) => {
        return { layerPath, timeSliderLayerInfo: timeSliderLayers?.[layerPath] };
      })
      .filter((layer) => layer?.timeSliderLayerInfo && !isLayerHiddenOnMap(layer.layerPath) && layer.timeSliderLayerInfo.isMainLayerPath)
      .map((layer) => {
        const additionalNames = layer.timeSliderLayerInfo.additionalLayerpaths?.map(
          (additionalLayerPath) => LegendEventProcessor.findLayerByPath(legendLayers, additionalLayerPath)?.layerName
        );
        const combinedAdditionalNames = additionalNames ? `/${additionalNames.join('/')}` : '';
        const layerName =
          `${LegendEventProcessor.findLayerByPath(legendLayers, layer.layerPath)?.layerName}${combinedAdditionalNames}` || '';
        return {
          layerName,
          layerPath: layer.layerPath,
          layerFeatures: getFilterInfo(layer.timeSliderLayerInfo),
          tooltip: getLayerTooltip(layer.timeSliderLayerInfo, layerName),
          layerStatus: 'loaded',
          queryStatus: 'processed',
          layerUniqueId: `${mapId}-${TABS.TIME_SLIDER}-${layer.layerPath}`,
        } as LayerListEntry;
      });
  }, [legendLayers, timeSliderLayers, visibleInRangeLayers, mapId, isLayerHiddenOnMap]);

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
    >
      {renderContent()}
    </Layout>
  );
}
