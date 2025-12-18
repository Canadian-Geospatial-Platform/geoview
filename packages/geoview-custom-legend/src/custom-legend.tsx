import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { getSxClassesMain } from './custom-legend-style';

interface CustomLegendPanelProps {
  config: TypeLegendProps;
}

interface SymbolConfig {
  type: 'image' | 'color' | 'line' | 'point' | 'polygon';
  url?: string;
  color?: string;
  width?: number;
  height?: number;
  stroke?: {
    color?: string;
    width?: number;
  };
}

interface FilterConfig {
  property: string;
  value: string | number | boolean;
  operator?: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
}

interface LegendItem {
  id: string;
  name: string;
  type?: 'group' | 'item';
  items?: LegendItem[];
  symbol?: SymbolConfig;
  description?: string;
  visible?: boolean;
  layerId?: string;
  filter?: FilterConfig;
}

type LegendListItems = LegendItem[];

interface DisplayConfig {
  orientation?: 'vertical' | 'horizontal';
  showTitle?: boolean;
  showToggle?: boolean;
  symbolSize?: {
    width?: number;
    height?: number;
  };
  text?: {
    size?: number;
    color?: string;
    fontFamily?: string;
  };
}

export type TypeLegendProps = {
  id: string;
  enabled?: boolean;
  isOpen?: boolean;
  title?: string;
  legendList: LegendListItems;
  display?: DisplayConfig;
  version: string;
};

export function CustomLegendPanel(props: CustomLegendPanelProps): JSX.Element {
  const { config } = props;
  const { legendList } = config;

  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box } = ui.elements;

  const theme = ui.useTheme();
  const legendSxMain = getSxClassesMain();

  const activeLegendList = legendList;

  // Helper function to render symbol based on type
  const renderSymbol = (symbol: SymbolConfig | undefined): JSX.Element | null => {
    if (!symbol) return null;

    const { type, url, color, width = 20, height = 20, stroke } = symbol;

    switch (type) {
      case 'image':
        return url ? <Box component="img" src={url} alt="" className="legendSymbol" sx={{ width, height }} /> : null;

      case 'color':
        return (
          <Box
            className="legendSymbol"
            sx={{
              width,
              height,
              backgroundColor: color || '#000',
              border: stroke ? `1px solid ${stroke.color}` : 'none',
            }}
          />
        );

      case 'line':
        return (
          <Box
            className="legendSymbol"
            sx={{
              width,
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: stroke?.width || 2,
                backgroundColor: color || '#000',
              }}
            />
          </Box>
        );

      case 'point':
        return (
          <Box
            className="legendSymbol"
            sx={{
              width,
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: width * 0.6,
                height: height * 0.6,
                borderRadius: '50%',
                backgroundColor: color || '#000',
                border: stroke ? `2px solid ${stroke.color}` : 'none',
              }}
            />
          </Box>
        );

      case 'polygon':
        return (
          <Box
            className="legendSymbol"
            sx={{
              width,
              height,
              backgroundColor: color || '#000',
              border: stroke ? `1px solid ${stroke.color}` : 'none',
            }}
          />
        );

      default:
        return null;
    }
  };

  // Recursive function to render legend items
  const renderLegendItem = (legendItem: LegendItem, level: number = 0): JSX.Element => {
    const { id, name, type = 'item', items, description } = legendItem;

    if (type === 'group' && items) {
      return (
        <Box key={id} sx={{ marginLeft: level * 2 }}>
          <Box sx={{ fontWeight: 'bold', marginBottom: 1 }}>{name}</Box>
          {items.map((childItem) => renderLegendItem(childItem, level + 1))}
        </Box>
      );
    }

    return (
      <Box key={id} sx={{ marginLeft: level * 2, marginBottom: 1 }}>
        <Box className="legend-item-container" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {renderSymbol(legendItem.symbol)}
          <Box className="legend-text" sx={{ flex: 1 }}>
            <Box className="legend-title" sx={{ fontSize: config.display?.text?.size || 12, fontWeight: 'normal' }}>
              {name}
            </Box>
            {description && (
              <Box
                className="legend-description"
                sx={{
                  fontSize: (config.display?.text?.size || 12) * 0.88,
                  color: theme.palette.geoViewColor.textColor.light[600],
                  marginTop: 0.5,
                }}
              >
                {description}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ background: theme.palette.geoViewColor.bgColor.main, ...legendSxMain.container }}>
      {activeLegendList.map((legendItem: LegendItem) => renderLegendItem(legendItem))}
    </Box>
  );
}
