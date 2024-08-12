import { Extent } from 'geoview-core/src/api/config/types/map-schema-types';
import { getSxClasses } from './custom-legend-style';

interface LegendPanelProps {
  mapId: string;
  config: TypeLegendProps;
}

interface TypeLegendItem {
  legendTitle: string;
  imageUrl: string;
  extent: Extent;
}

type LegendListItems = TypeLegendItem[];

type TypeLegendProps = {
  isOpen: boolean;
  legendList: LegendListItems;
  version: string;
};

export function LegendPanel(props: LegendPanelProps): JSX.Element {
  const { mapId, config } = props;
  const legendList = config.legendList as LegendListItems;

  const { cgpv } = window;
  const { api, ui } = cgpv;

  const myMap = api.maps[mapId];
  const { Card, Box } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <Box sx={sxClasses.legendCard}>
      {legendList.map((legendItem: TypeLegendItem, index) => {
        return (
          <Card
            tabIndex={0}
            className="legendCardThumbnail"
            onClick={() => myMap.zoomToLngLatExtentOrCoordinate(legendItem.extent, { maxZoom: 14 })}
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            title={legendItem.legendTitle}
            contentCard={
              // eslint-disable-next-line react/jsx-no-useless-fragment
              <>
                {typeof legendItem.imageUrl === 'string' && (
                  // eslint-disable-next-line react/no-array-index-key
                  <Box component="img" key={index} src={legendItem.imageUrl} alt="" className="legendCardThumbnail" />
                )}
              </>
            }
          />
        );
      })}
    </Box>
  );
}
