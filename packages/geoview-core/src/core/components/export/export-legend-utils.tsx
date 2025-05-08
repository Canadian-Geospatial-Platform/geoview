import { memo } from 'react';
import { useTheme } from '@mui/material/styles';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { logger } from '@/core/utils/logger';
import { CV_CONST_LAYER_TYPES } from '@/api/config/types/config-constants';
import { getSxClasses } from './export-modal-style';

interface LegendContainerProps {
  layers: TypeLegendLayer[];
}

/**
 * LegendContainer component to display a list of layers and their items.
 */
function LegendContainerComponent({ layers }: LegendContainerProps): JSX.Element {
  logger.logTraceRender('components/legend/legend-export-utils', layers);
  const theme = useTheme();
  const mapId = useGeoViewMapId();
  // Helper to render icon

  const renderWMSLayerImage = (layer: TypeLegendLayer, alt: string): JSX.Element => {
    const imgUrl = layer.icons?.[0]?.iconImage;
    const isWMSWithLegend =
      layer.type === CV_CONST_LAYER_TYPES.WMS &&
      layer.icons?.[0]?.iconImage &&
      layer.icons?.[0]?.iconImage &&
      layer.icons[0].iconImage !== 'no data';

    if (isWMSWithLegend) {
      return <img src={imgUrl ?? ''} alt={alt} style={getSxClasses(theme).wmsImage} title="WMS Legend" />;
    }
    return <> </>;
  };

  const renderLayerItemIcon = (imgUrl: string | null | undefined, alt: string): JSX.Element => {
    if (!imgUrl) return <> </>;
    return <img src={imgUrl} alt={alt} style={getSxClasses(theme).legendItemIcon} />;
  };
  // Recursive function to render a layer and its children/items
  const renderLayer = (layer: TypeLegendLayer): JSX.Element => {
    const layerVisibility = MapEventProcessor.getMapVisibilityFromOrderedLayerInfo(mapId, layer.layerPath);

    if (layerVisibility === false) return <> </>;

    return (
      <div key={layer.layerPath} style={getSxClasses(theme).legendUnit}>
        {/* Layer icon and name */}
        <div style={getSxClasses(theme).legendTitle}>
          <span style={getSxClasses(theme).legendTitle}>{layer.layerName}</span>
          <span style={getSxClasses(theme).spantoLine}>{renderWMSLayerImage(layer, 'icon')}</span>
        </div>
        {/* Children */}
        {layer.children && layer.children.length > 0 && layer.children.map((child) => renderLayer(child))}
        {/* Items for this layer */}
        {layer.items && layer.items.length > 0 && (
          <div>
            {layer.items.map((item) => (
              <div key={item.name} style={getSxClasses(theme).legendItem}>
                {item.icon && renderLayerItemIcon(item.icon, item.name)}
                <span style={getSxClasses(theme).legendItem}>{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return <div style={getSxClasses(theme).legendContainer}>{layers.map((layer) => renderLayer(layer))}</div>;
}

LegendContainerComponent.displayName = 'LegendContainerComponent';

export const LegendContainer = memo(LegendContainerComponent);
