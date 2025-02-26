import { JSX } from 'react';
import { Box } from '@mui/material';

interface LegendPanelProps {
  // eslint-disable-next-line react/no-unused-prop-types
  mapId: string;
}

export function LegendPanel(props: LegendPanelProps): JSX.Element {
  return <Box sx={{ padding: 2 }}>CustomLegend Package</Box>;
}
