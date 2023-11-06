import { useTheme } from '@mui/material/styles';
import { SingleLayer } from './single-layer';
import { getSxClasses } from '../layers-style';
import { List } from '@/ui';
import { useLayersList } from '@/core/stores/store-interface-and-intial-values/layer-state';

export function LayersList(): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const legendLayers = useLayersList(); // get store value(s)

  const legendItems = legendLayers.map((details) => {
    return <SingleLayer key={`layerKey-${details.layerPath}-${details.layerPath}`} depth={0} layer={details} />;
  });

  return <List sx={sxClasses.list}>{legendItems}</List>;
}
