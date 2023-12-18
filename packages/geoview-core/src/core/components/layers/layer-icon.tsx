import { Box, CircularProgressBase, ErrorIcon, GroupWorkOutlinedIcon, IconButton } from '@/ui';
import { TypeLegendLayer } from './types';
import { IconStack } from '../icon-stack/icon-stack';

interface LayerIconProps {
  layer: TypeLegendLayer;
}

export function LayerIcon({ layer }: LayerIconProps): JSX.Element {
  if (layer.layerStatus === 'error') {
    return (
      <IconButton sx={{ color: 'red' }}>
        <ErrorIcon />
      </IconButton>
    );
  }
  if (layer.layerStatus === 'loading') {
    return (
      <Box sx={{ padding: '5px', marginRight: '10px' }}>
        <CircularProgressBase size={20} />
      </Box>
    );
  }
  if (layer?.children.length) {
    return (
      <IconButton color="primary">
        <GroupWorkOutlinedIcon />
      </IconButton>
    );
  }
  return <IconStack layerPath={layer.layerPath} />;
}
