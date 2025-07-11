import { memo, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { useTimeSliderLayers } from '@/core/stores/store-interface-and-intial-values/time-slider-state';

import { logger } from '@/core/utils/logger';
import { CV_CONST_LAYER_TYPES } from '@/api/config/types/config-constants';
import { getSxClasses } from './export-modal-style';
import { DateMgt } from '@/core/utils/date-mgt';

interface LegendContainerProps {
  layers: TypeLegendLayer[];
}

/**
 * LegendContainer component to display a list of layers and their items.
 */
function LegendContainerComponent({ layers }: LegendContainerProps): JSX.Element {
  logger.logTraceRender('components/legend/legend-export-utils', layers);
  const timeSliderLayers = useTimeSliderLayers();
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

    // Get the temporal dimension directly from the layer actions
    const temporalDimension = timeSliderLayers[layer.layerPath];
    const hasTimeRange = Boolean(temporalDimension?.range?.length);

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
              {temporalDimension.singleHandle ? (
                <span>
                  {DateMgt.formatDate(
                    new Date(temporalDimension.values[0]),
                    temporalDimension.displayPattern?.includes('minute') ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
                  )}
                </span>
              ) : (
                <span>
                  {DateMgt.formatDate(
                    new Date(temporalDimension.values[0]),
                    temporalDimension.displayPattern?.includes('minute') ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
                  )}{' '}
                  -{' '}
                  {DateMgt.formatDate(
                    new Date(temporalDimension.values[1]),
                    temporalDimension.displayPattern?.includes('minute') ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
                  )}
                </span>
              )}
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
