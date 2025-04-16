/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-no-useless-fragment */
import { Key } from 'react';
import { InfoSection } from './infosection';
import { getSxClasses } from './custom-legend-style';

interface CustomLegendPanelProps {
  mapId: string;
}

export function CustomLegendPanel(props: CustomLegendPanelProps): JSX.Element {
  const { mapId } = props;

  const { cgpv } = window;
  const { api, ui } = cgpv;
  const { Card, Box } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  // Get layers from the map
  const layers = api.maps[mapId]?.layer?.layers || [];
  console.log('Layers:', layers); // Debugging: Log layers

  return (
    <Box sx={sxClasses.legendCard}>
      {layers.map(
        (
          layer: { getLegend: () => { symbolUrl: string; legendTitle: string; description: string | null }[]; name: string },
          index: number
        ) => {
          const legendItems = layer.getLegend(); // Assuming `getLegend` returns legend items for the layer
          console.log(`Legend Items for Layer ${layer.name}:`, legendItems); // Debugging: Log legend items
          return (
            <Card
              tabIndex={0}
              className="legendCardItem"
              key={index}
              title={String(layer.name)}
              contentCard={
                <>
                  {legendItems.map(
                    (item: { symbolUrl: string; legendTitle: string; description: string | null }, itemIndex: Key | null | undefined) => (
                      <div key={itemIndex} className="legend-item-container">
                        <Box component="img" src={item.symbolUrl} alt="" className="legendSymbol" />
                        <div className="legend-text">
                          {/* Use InfoSection for title */}
                          <InfoSection
                            infoType="legend"
                            section={{
                              title: item.legendTitle,
                              symbols: [],
                              content: null,
                            }}
                          />
                          {/* Use InfoSection for description */}
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
                    )
                  )}
                </>
              }
            />
          );
        }
      )}
    </Box>
  );
}
