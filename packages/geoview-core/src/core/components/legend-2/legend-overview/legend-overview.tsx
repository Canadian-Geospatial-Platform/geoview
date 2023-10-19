import { Box, Grid, List, ListItem, ListItemText, Paper, Tooltip } from '@/ui';
import { useLegendHelpers } from '../helpers';


export interface LegendOverviewProps {
  layerIds: string[];
  mapId: string
}

export function LegendOverview(props: LegendOverviewProps): JSX.Element {
  const { layerIds, mapId } = props;
  const legendHelpers = useLegendHelpers();
  const visibleLayers = legendHelpers.getLegendLayerInstances(mapId, layerIds)
                        .filter(layer => layer.getVisible());
  const layerNames = visibleLayers
    .map(layer => {
      const layerName = legendHelpers.getLayerName(layer);
      const path = `${layer.geoviewLayerId}/${layer.activeLayer?.layerId}`;
      const iconDetails = legendHelpers.getLayerIconImage(mapId, path);
      console.log('path is ', path, iconDetails);
      return (
        <ListItem key={`layerKey-${layer.geoviewLayerId}`} sx={{border:"1px solid #ccc"}}>
            <Tooltip title={layerName} placement="top" enterDelay={1000}>
              <ListItemText primary={layerName} />
          </Tooltip>
        </ListItem>
      )
    });



  return (
    <Paper>
      <List sx={{width: '100%', padding: '20px'}}>
        {layerNames}
        <Box>
          <p>All selected Layers will be displayed here eventually.</p>
        </Box>
      </List>
    </Paper>
  );
}
