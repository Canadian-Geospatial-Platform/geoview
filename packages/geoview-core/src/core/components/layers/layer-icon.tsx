import { Box, CircularProgressBase, ErrorIcon, GroupWorkOutlinedIcon } from '@/ui';
import { TypeLegendLayer } from './types';
import { IconStack } from '../icon-stack/icon-stack';

interface LayerIconProps {
  layer: TypeLegendLayer;
}

export function LayerIcon({ layer }: LayerIconProps): JSX.Element {
  if (layer.layerStatus === 'error') {
    return <ErrorIcon color="error" />;
  }
  if (layer.layerStatus === 'processing') {
    return (
      <Box sx={{ padding: '5px', marginRight: '10px' }}>
        <CircularProgressBase size={20} />
      </Box>
    );
  }
  if (layer?.children.length) {
    return <GroupWorkOutlinedIcon color="primary" />;
  }
  return <IconStack layerPath={layer.layerPath} />;
}
