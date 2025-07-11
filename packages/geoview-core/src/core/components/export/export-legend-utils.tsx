import { memo, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { logger } from '@/core/utils/logger';
import { CV_CONST_LAYER_TYPES } from '@/api/config/types/config-constants';
import { getSxClasses } from './export-modal-style';
import { useTimeSliderLayers } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { DateMgt } from '@/core/utils/date-mgt';

interface LegendContainerProps {
  layers: TypeLegendLayer[];
}

/**
 * LegendContainer component to display a list of layers and their items.
 */
function LegendContainerComponent({ layers }: LegendContainerProps): JSX.Element {
  const timeSliderLayers = useTimeSliderLayers();

  // Log the layers for debugging purposes
  logger.logTraceRender('components/legend/legend-export-utils', layers);
  const theme = useTheme();
  const mapId = useGeoViewMapId();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  // Helper to render icon

  const renderWMSLayerImage = (layer: TypeLegendLayer, alt: string): JSX.Element => {
    const imgUrl = layer.icons?.[0]?.iconImage;
    const isWMSWithLegend =
      layer.type === CV_CONST_LAYER_TYPES.WMS &&
      layer.icons?.[0]?.iconImage &&
      layer.icons?.[0]?.iconImage &&
      layer.icons[0].iconImage !== 'no data';

    if (isWMSWithLegend) {
      return <img src={imgUrl ?? ''} alt={alt} style={sxClasses.wmsImage} title="WMS Legend" />;
    }
    return <> </>;
  };

  const renderLayerItemIcon = (imgUrl: string | null | undefined, alt: string): JSX.Element => {
    if (!imgUrl) return <> </>;
    return <img src={imgUrl} alt={alt} style={sxClasses.legendItemIcon} />;
  };

  // Recursive function to render a layer and its children/items
  const renderLayer = (layer: TypeLegendLayer): JSX.Element => {
    const layerVisibility = MapEventProcessor.getMapVisibilityFromOrderedLayerInfo(mapId, layer.layerPath);

    if (layerVisibility === false) return <> </>;

    // Default timeSliderInfo to empty object if timeSliderLayers is undefined
    const timeSliderInfo = timeSliderLayers?.[layer.layerPath] ?? {};
    const hasTimeRange = timeSliderInfo?.range?.length > 0;

    return (
      <div key={layer.layerPath} style={sxClasses.legendSpacing}>
        {/* Layer icon and name */}
        <div style={sxClasses.legendTitle}>
          <span>{layer.layerName}</span>
        </div>
        {/* Time range if available */}
        {hasTimeRange && (
          <div style={sxClasses.toLine}>
            <span style={{ ...sxClasses.legendItem, fontStyle: 'italic' }}>
              {DateMgt.formatDate(timeSliderInfo.range[0], 'YYYY-MM-DD')} /{' '}
              {DateMgt.formatDate(timeSliderInfo.range[timeSliderInfo.range.length / -1], 'YYYY-MM-DD')}
            </span>
          </div>
        )}
        <div>
          <span style={sxClasses.toLine}>{renderWMSLayerImage(layer, 'icon')}</span>
        </div>
        {/* Children */}
        {layer.children && layer.children.length > 0 && layer.children.map((child) => renderLayer(child))}
        {/* Items for this layer */}
        {layer.items && layer.items.length > 0 && (
          <div style={sxClasses.toLine}>
            {layer.items.map(
              (item) =>
                item.isVisible && (
                  <div key={item.name} style={sxClasses.legendItem}>
                    {item.icon && renderLayerItemIcon(item.icon, item.name)}
                    <span>{item.name}</span>
                  </div>
                )
            )}
          </div>
        )}
      </div>
    );
  };

  return <div style={sxClasses.legendContainer}>{layers.map((layer) => renderLayer(layer))}</div>;
}

LegendContainerComponent.displayName = 'LegendContainerComponent';

export const LegendContainer = memo(LegendContainerComponent);
