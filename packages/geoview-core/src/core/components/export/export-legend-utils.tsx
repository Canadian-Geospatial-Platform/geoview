import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { logger } from '@/core/utils/logger';
import { Button, BrowserNotSupportedIcon, GroupWorkOutlinedIcon } from '@/ui';
import { CV_CONST_LAYER_TYPES } from '@/api/config/types/config-constants';

interface LegendContainerProps {
  layers: TypeLegendLayer[];
}

/**
 * LegendContainer component to display a list of layers and their items.
 */
function LegendContainerComponent({ layers }: LegendContainerProps): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
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
      paddingRight: '0.2rem',
      marginLeft: '0.2em',
      textAlign: 'left',
      fontWeight: 'bold',
      fontSize: theme.palette.geoViewFontSize.sm,
    },
    legendLayerIcon: {
      maxWidth: '1.5em',
      maxHeight: '1.5em',
      verticalAlign: 'middle',
      textAlign: 'left',
    },
    legendItemIcon: {
      maxWidth: '1.5em',
      verticalAlign: 'middle',
      marginLeft: '1.5em',
    },
    legendItem: {
      textAlign: 'left',
      marginLeft: '0.5em',
      paddingLeft: '0.15rem',
      fontSize: theme.palette.geoViewFontSize.sm,
    },
    hr: {
      width: '80%',
      marginLeft: '7px',
    },
    wmsImage: {
      maxWidth: '90%',
      cursor: 'pointer',
    },
    iconBtn: {
      width: '1.5rem',
      height: '1.5rem',
      minWidth: 0,
      padding: 0,
      '&:hover': { padding: 0, border: '1px solid #92a8d1' },
      border: '1px solid #a2b9bc',
    },
  } as const;

  const mapId = useGeoViewMapId();
  // Helper to render icon
  const renderLayerIcon = (layer: TypeLegendLayer, alt: string): JSX.Element => {
    const imgUrl = layer.icons?.[0]?.iconImage;

    if (layer.children && layer.children.length > 0) {
      return <GroupWorkOutlinedIcon color="primary" />;
    }

    if (!imgUrl || imgUrl === 'no data') {
      return <BrowserNotSupportedIcon color="primary" />;
    }

    return <img src={imgUrl} alt={alt} style={styles.legendLayerIcon} />;
  };

  const renderWMSLayerImage = (layer: TypeLegendLayer, alt: string): JSX.Element => {
    const imgUrl = layer.icons?.[0]?.iconImage;
    const isWMSWithLegend =
      layer.type === CV_CONST_LAYER_TYPES.WMS &&
      layer.icons?.[0]?.iconImage &&
      layer.icons?.[0]?.iconImage &&
      layer.icons[0].iconImage !== 'no data';

    if (isWMSWithLegend) {
      return <img src={imgUrl ?? ''} alt={alt} style={styles.wmsImage} title={t('general.clickEnlarge')!} />;
    }
    return <> </>;
  };

  const renderLayerItemIcon = (imgUrl: string | null | undefined, alt: string): JSX.Element => {
    if (!imgUrl) return <> </>;
    return <img src={imgUrl} alt={alt} style={styles.legendItemIcon} />;
  };
  // Recursive function to render a layer and its children/items
  const renderLayer = (layer: TypeLegendLayer): JSX.Element => {
    const layerVisibility = MapEventProcessor.getMapVisibilityFromOrderedLayerInfo(mapId, layer.layerPath);

    if (layerVisibility === false) return <> </>;

    return (
      <div key={layer.layerPath}>
        {/* Layer icon and name */}
        <div style={styles.legendTitle}>
          <Button type="text" sx={{ ...styles.iconBtn }}>
            {renderLayerIcon(layer, 'icon')}
          </Button>
          <span style={styles.legendTitle}>{layer.layerName}</span>
          <hr style={styles.hr} />
          {renderWMSLayerImage(layer, 'icon')}
        </div>
        {/* Children */}
        {layer.children && layer.children.length > 0 && layer.children.map((child) => renderLayer(child))}
        {/* Items for this layer */}
        {layer.items && layer.items.length > 0 && (
          <div>
            {layer.items.map((item) => (
              <div key={item.name} style={styles.legendItem}>
                {item.icon && renderLayerItemIcon(item.icon, item.name)}
                <span style={styles.legendItem}>{item.name}</span>
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
