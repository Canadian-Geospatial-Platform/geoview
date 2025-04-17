import { memo } from 'react';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { logger } from '@/core/utils/logger';
import { BrowserNotSupportedIcon, GroupWorkOutlinedIcon } from '@/ui';

interface LegendContainerProps {
  layers: TypeLegendLayer[];
}

/**
 * LegendContainer component to display a list of layers and their items.
 */
function LegendContainerComponent({ layers }: LegendContainerProps): JSX.Element {
  logger.logTraceRender('components/legend/legend-export-utils', layers);
  const styles = {
    legendContainer: {
      padding: '1rem',
      margin: '1rem',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    legendTitle: {
      paddingRight: '0.5rem',
      marginLeft: '1em',
      textAlign: 'left',
      fontWeight: 'bold',
    },
    legendIcon: {
      maxWidth: '1.5em',
      verticalAlign: 'middle',
    },
    legendItem: {
      textAlign: 'left',
      marginLeft: '1.5em',
    },
  } as const;

  const mapId = useGeoViewMapId();
  // Helper to render icon
  const renderLayerIcon = (layer: TypeLegendLayer, alt: string): JSX.Element => {
    const imgUrl = layer.icons?.[0]?.iconImage;
    const isaGroup = layer.children && layer.children.length > 0;

    if (isaGroup) {
      return <GroupWorkOutlinedIcon color="primary" />;
    }

    if (!imgUrl || imgUrl === 'no data') {
      return <BrowserNotSupportedIcon color="primary" />;
    }

    return <img src={imgUrl} alt={alt} style={styles.legendIcon} />;
  };

  const renderLayerItemIcon = (imgUrl: string | null | undefined, alt: string): JSX.Element => {
    if (!imgUrl) return <> </>;
    return <img src={imgUrl} alt={alt} style={styles.legendIcon} />;
  };
  // Recursive function to render a layer and its children/items
  const renderLayer = (layer: TypeLegendLayer): JSX.Element => {
    const layerVisibility = MapEventProcessor.getMapVisibilityFromOrderedLayerInfo(mapId, layer.layerPath);

    if (layerVisibility === false) return <> </>;

    return (
      <div key={layer.layerPath}>
        {/* Layer icon and name */}
        <div style={styles.legendTitle}>
          {renderLayerIcon(layer, 'icon')}
          <span>{layer.layerName}</span>
        </div>
        {/* Children */}
        {layer.children && layer.children.length > 0 && layer.children.map((child) => renderLayer(child))}
        {/* Items for this layer */}
        {layer.items && layer.items.length > 0 && (
          <div>
            {layer.items.map((item) => (
              <div key={item.name} style={styles.legendItem}>
                {item.icon && renderLayerItemIcon(item.icon, item.name)}
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return <div style={styles.legendContainer}>{layers.map((layer) => renderLayer(layer))}</div>;
}

LegendContainerComponent.displayName = 'LegendContainerComponent';

export const LegendContainer = memo(LegendContainerComponent);
