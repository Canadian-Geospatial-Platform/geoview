import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { getSxClassesMain, getSxClasses } from './custom-legend-style';

interface CustomLegendPanelProps {
  config: TypeLegendProps;
}

interface LegendItem {
  legendTitle: string;
  symbolUrl: string;
  description?: string;
}

type LegendListItems = LegendItem[];

type LegendConfig = { legendList: LegendListItems };

export type TypeLegendProps = {
  isOpen: boolean;
  legendList: LegendListItems;
  version: string;
};

export function CustomLegendPanel(props: CustomLegendPanelProps): JSX.Element {
  const { config } = props;
  const { legendList } = config;

  const { cgpv } = window as TypeWindow;
  const { ui, reactUtilities } = cgpv;
  const { useEffect, useState } = reactUtilities.react;
  const { Card, Box } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);
  const legendSxMain = getSxClassesMain();

  const [activeLegendList, setActiveLegendList] = useState<LegendListItems>(legendList);

  useEffect(() => {
    const fetchLegendFromConfig = async (): Promise<void> => {
      try {
        const response = await fetch('/configs/navigator/demos/17-package-custom-legend.json');
        if (!response.ok) throw new Error('Failed to load custom legend config');

        const data = (await response.json()) as Partial<LegendConfig>;
        const list = Array.isArray(data.legendList) ? data.legendList : legendList;
        setActiveLegendList(list);
      } catch {
        setActiveLegendList(legendList);
      }
    };

    void fetchLegendFromConfig();
  }, [legendList]);

  return (
    <Box sx={{ background: theme.palette.geoViewColor.bgColor.main, ...legendSxMain.container }}>
      {activeLegendList.map((legendItem: LegendItem) => (
        <Box key={`${legendItem.legendTitle}-${legendItem.symbolUrl}`} sx={sxClasses.legendLayerListItem}>
          <Card
            tabIndex={0}
            className="legendCardItem"
            title={legendItem.legendTitle}
            contentCard={
              typeof legendItem.symbolUrl === 'string' ? (
                <div className="legend-item-container">
                  <Box component="img" src={legendItem.symbolUrl} alt="" className="legendSymbol" />
                  <div className="legend-text">
                    <span className="legend-title">{legendItem.legendTitle}</span>
                    {legendItem.description && <span className="legend-description">{legendItem.description}</span>}
                  </div>
                </div>
              ) : null
            }
          />
        </Box>
      ))}
    </Box>
  );
}
