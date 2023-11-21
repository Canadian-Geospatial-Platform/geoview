import { LegendItemsDetailsProps } from './types';
import { LayersPanel } from './layers-panel';

export function Layers(props: LegendItemsDetailsProps): JSX.Element {
  return <LayersPanel {...props} />;
}
