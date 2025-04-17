/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-no-useless-fragment */
import { useMapStoreActions, useMapVisibleLayers } from 'geoview-core/src/core/stores/store-interface-and-intial-values/map-state';
import { Extent } from 'geoview-core/src/api/config/types/map-schema-types';
import { getSxClasses } from './custom-legend-style';
import { InfoSection } from './infosection';

interface CustomLegendPanelProps {
  mapId: string;
  config: {
    legend: { symbolUrl: string; legendTitle: string; description: string | null }[];
  };
}

export function CustomLegendPanel(props: CustomLegendPanelProps): JSX.Element {
  const { mapId, config } = props;

  const { cgpv } = window;
  const { api, ui } = cgpv;

  const myMap = api.maps[mapId];
  const { Card, Box } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  const { highlightBBox } = useMapStoreActions();
  const visibleLayers = useMapVisibleLayers() as string[];

  return (
    <Box sx={sxClasses.legendCard}>
      {config.legend.map((item, index) => (
        <Card
          tabIndex={0}
          className="legendCardItem"
          key={index}
          title={item.legendTitle}
          contentCard={
            <div className="legend-item-container">
              <Box component="img" src={item.symbolUrl} alt="" className="legendSymbol" />
              <div className="legend-text">
                <InfoSection
                  infoType="legend"
                  section={{
                    title: item.legendTitle,
                    symbols: [],
                    content: null,
                  }}
                />
                {item.description && (
                  <InfoSection
                    infoType="description"
                    section={{
                      title: '',
                      symbols: [],
                      content: item.description,
                    }}
                  />
                )}
              </div>
            </div>
          }
          onClick={() => {
            // Example usage of highlightBBox with visible layers
            if (visibleLayers.includes(item.legendTitle)) {
              const extent: Extent = myMap.getView().calculateExtent();
              highlightBBox(extent);
            }
          }}
        />
      ))}
    </Box>
  );
}
