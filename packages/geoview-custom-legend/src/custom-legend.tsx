import { HubOutlinedIcon } from 'geoview-core/src/ui/icons';
import { JSX, useState } from 'react';
import { getSxClasses } from './custom-legend-style';

interface TypeLegendProps {
  isOpen?: boolean;
}

interface LegendPanelProps {
  config?: TypeLegendProps;
}

export function LegendPanel({ config }: LegendPanelProps): JSX.Element {
  const [isPanelOpen, setIsPanelOpen] = useState(config?.isOpen || false);
  const classes = getSxClasses();

  const togglePanel = (): void => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <div>
      <button type="button" onClick={togglePanel} style={classes.legendButton}>
        <HubOutlinedIcon />
      </button>

      {isPanelOpen && <div style={classes.legendPanel}>CustomLegend Package</div>}
    </div>
  );
}
