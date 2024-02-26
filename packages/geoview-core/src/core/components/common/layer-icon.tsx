import { Box, CircularProgressBase, ErrorIcon, GroupWorkOutlinedIcon } from '@/ui';
import { TypeLegendLayer } from '../layers/types';
import { IconStack } from '../icon-stack/icon-stack';
import { LayerListEntry } from '.';

interface LayerIconProps {
  layer: TypeLegendLayer | LayerListEntry;
}

export function LayerIcon({ layer }: LayerIconProps): JSX.Element {
  if (layer.layerStatus === 'error' || ('queryStatus' in layer && layer.queryStatus === 'error')) {
    return <ErrorIcon color="error" />;
  }
  if (layer.layerStatus === 'processing' || layer.layerStatus === 'loading' || ('queryStatus' in layer && layer.queryStatus === 'processing')) {
    return (
      <Box sx={{ padding: '5px', marginRight: '10px' }}>
        <CircularProgressBase size={20} />
      </Box>
    );
  }
  if ('children' in layer && layer?.children.length) {
    return <GroupWorkOutlinedIcon color="primary" />;
  }
  return <IconStack layerPath={layer.layerPath} />;
}
