import { JSX } from 'react';
import { Box } from '@mui/material';

interface CustomLegendPanelProps {
  // eslint-disable-next-line react/no-unused-prop-types
  mapId: string;
  // eslint-disable-next-line react/no-unused-prop-types
  config: unknown;
}

export function CustomLegendPanel(props: CustomLegendPanelProps): JSX.Element {
  return <Box sx={{ padding: 2 }}>CustomLegend Package</Box>;
}
