import { getSxClasses } from './custom-legend-style';

interface CustomLegendPanelProps {
  mapId: string;
  config: TypeLegendProps;
}

interface LegendItem {
  legendTitle: string;
  symbolUrl: string;
  description?: string;
}

type LegendListItems = LegendItem[];

type TypeLegendProps = {
  isOpen: boolean;
  legendList: LegendListItems;
  version: string;
};

export function CustomLegendPanel(props: CustomLegendPanelProps): JSX.Element {
  const { mapId, config } = props;
  const legendList = config.legendList as LegendListItems;

  const { cgpv } = window;
  const { api, ui } = cgpv;
  const { Card, Box } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <Box sx={sxClasses.legendCard}>
      {legendList.map((legendItem: LegendItem, index) => {
        return (
          <Card
            tabIndex={0}
            className="legendCardItem"
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            title={legendItem.legendTitle}
            contentCard={
              // eslint-disable-next-line react/jsx-no-useless-fragment
              <>
                {typeof legendItem.symbolUrl === 'string' && (
                  <div className="legend-item-container">
                    {/* eslint-disable-next-line react/no-array-index-key */}
                    <Box component="img" key={index} src={legendItem.symbolUrl} alt="" className="legendSymbol" />
                    <div className="legend-text">
                      <span className="legend-title">{legendItem.legendTitle}</span>
                      {legendItem.description && <span className="legend-description">{legendItem.description}</span>}
                    </div>
                  </div>
                )}
              </>
            }
          />
        );
      })}
    </Box>
  );
}
