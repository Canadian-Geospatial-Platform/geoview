import { Extent } from 'geoview-core/src/api/config/types/map-schema-types';
import { getSxClasses } from './custom-legend-style';

interface TypeLegendEntry {
  id: string;
  name?: string;
  opacity?: number;
  visibility?: boolean;
  state?: {
    visibility?: boolean;
    opacity?: number;
  };
  symbology?: {
    icon: string;
    label: string;
  }[];
}

interface TypeLegendLayer {
  layerType: string;
  layerEntries: TypeLegendEntry[];
}

type TypeLegendProps = {
  isOpen: boolean;
  legendList?: TypeLegendLayer[]; // Ensuring it can be undefined
  version?: string;
};

interface LegendPanelProps {
  config?: TypeLegendProps; // Made optional
}

export function LegendPanel({ config }: LegendPanelProps): JSX.Element {
  // Provide default values for `config` if it's not passed
  const defaultConfig: TypeLegendProps = { isOpen: false, legendList: [] };

  // Use the config passed in or fall back to defaultConfig
  const finalConfig = { ...defaultConfig, ...config };

  // Ensure `legendList` is always defined as an array
  const legendList = finalConfig.legendList || [];

  return (
    <div>
      {legendList.length > 0 ? (
        legendList.map((layer) => (
          <div key={layer.layerType}>
            <h3>{layer.layerType}</h3>
            {Array.isArray(layer.layerEntries) ? (
              layer.layerEntries.map((entry) => (
                <div key={entry.id}>
                  <p>{entry.name || 'Unnamed Entry'}</p>
                  {Array.isArray(entry.symbology) ? (
                    entry.symbology.map((symbol) => (
                      <div key={symbol.icon}>
                        <img src={symbol.icon} alt={symbol.label} />
                        <span>{symbol.label}</span>
                      </div>
                    ))
                  ) : (
                    <p>No symbology available</p>
                  )}
                </div>
              ))
            ) : (
              <p>No layer entries available</p>
            )}
          </div>
        ))
      ) : (
        <p>No legend available</p>
      )}
    </div>
  );
}
