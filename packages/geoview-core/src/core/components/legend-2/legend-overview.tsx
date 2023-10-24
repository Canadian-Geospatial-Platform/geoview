import { api } from '@/app';
import { Box, Grid, List, ListItem, ListItemText, Paper, Tooltip } from '@/ui';


export interface LegendOverviewProps {
  layerIds: string[];
  mapId: string
}

export function LegendOverview(props: LegendOverviewProps): JSX.Element {
  const { layerIds, mapId } = props;

  const legendInfo = api.maps[mapId].legend.legendLayerSet.resultSets;

  return (
    <Paper>
      <List sx={{width: '100%', padding: '20px'}}>
        <Box>
          <p>All selected Layers will be displayed here eventually.</p>
        </Box>
      </List>
    </Paper>
  );
}